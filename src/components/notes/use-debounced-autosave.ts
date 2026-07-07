"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { NoteWithTags } from "@/types/database";

const AUTOSAVE_DELAY_MS = 1_500;
const RATE_LIMIT_RETRY_MS = 5_000;

type DraftSnapshot = {
  title: string;
  contentMarkdown: string;
};

type StoredDraft = DraftSnapshot & {
  noteId: string;
  baseRevision: number;
  savedAt: string;
};

type ConflictState = {
  serverRevision: number;
  serverNote: DraftSnapshot;
  localDraft: DraftSnapshot;
};

type AutosaveStatus = "idle" | "saving" | "saved" | "failed" | "offline";

type UseDebouncedAutosaveOptions = {
  note: NoteWithTags | null;
  title: string;
  contentMarkdown: string;
  onDraftRecovered: (draft: DraftSnapshot) => void;
  onSaved: (note: NoteWithTags) => void;
  onError?: (message: string) => void;
};

type NoteResponse = {
  ok: boolean;
  data?: {
    note: NoteWithTags;
  };
  error?: {
    code?: string;
    message?: string;
  };
};

type ConflictResponse = {
  ok: false;
  error: {
    code: "REVISION_CONFLICT";
    message: string;
  };
  serverRevision: number;
  serverNote: DraftSnapshot;
};

function isConflictResponse(
  payload: NoteResponse | ConflictResponse,
  status: number
): payload is ConflictResponse {
  return (
    status === 409 &&
    payload.ok === false &&
    "error" in payload &&
    payload.error?.code === "REVISION_CONFLICT" &&
    "serverRevision" in payload &&
    "serverNote" in payload
  );
}

function getDraftStorageKey(noteId: string) {
  return `minote:draft:${noteId}`;
}

function snapshotsEqual(left: DraftSnapshot, right: DraftSnapshot) {
  return (
    left.title === right.title &&
    left.contentMarkdown === right.contentMarkdown
  );
}

function noteToSnapshot(note: NoteWithTags): DraftSnapshot {
  return {
    title: note.title,
    contentMarkdown: note.content_markdown,
  };
}

function normalizeTitle(title: string) {
  const trimmed = title.trim();
  return trimmed.length > 0 ? trimmed : "Untitled";
}

export function useDebouncedAutosave({
  note,
  title,
  contentMarkdown,
  onDraftRecovered,
  onSaved,
  onError,
}: UseDebouncedAutosaveOptions) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [baselineSnapshot, setBaselineSnapshot] = useState<DraftSnapshot | null>(() =>
    note ? noteToSnapshot(note) : null
  );
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    note?.last_saved_at ?? null
  );
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  const baselineRef = useRef<NoteWithTags | null>(note);
  const saveTimerRef = useRef<number | null>(null);
  const saveInFlightRef = useRef(false);
  const pendingRetryRef = useRef(false);
  const rateLimitedUntilRef = useRef<number>(0);
  const hydratedDraftNoteIdRef = useRef<string | null>(null);

  const currentDraft = useMemo<DraftSnapshot>(
    () => ({
      title,
      contentMarkdown,
    }),
    [contentMarkdown, title]
  );
  const isDirty = baselineSnapshot
    ? !snapshotsEqual(currentDraft, baselineSnapshot)
    : false;

  const persistDraft = useCallback(
    (draft: DraftSnapshot, baseRevision: number) => {
      if (!note) {
        return;
      }

      window.localStorage.setItem(
        getDraftStorageKey(note.id),
        JSON.stringify({
          noteId: note.id,
          title: draft.title,
          contentMarkdown: draft.contentMarkdown,
          baseRevision,
          savedAt: new Date().toISOString(),
        } satisfies StoredDraft)
      );
    },
    [note]
  );

  const clearDraft = useCallback((noteId: string) => {
    window.localStorage.removeItem(getDraftStorageKey(noteId));
  }, []);

  const commitSavedNote = useCallback(
    (savedNote: NoteWithTags) => {
      baselineRef.current = savedNote;
      setBaselineSnapshot(noteToSnapshot(savedNote));
      setLastSavedAt(savedNote.last_saved_at);
      clearDraft(savedNote.id);
      setConflict(null);
      setConflictDialogOpen(false);
      setStatus("saved");
      onSaved(savedNote);
    },
    [clearDraft, onSaved]
  );

  const saveDraft = useCallback(
    async (
      draft: DraftSnapshot,
      baseRevisionOverride?: number,
      options?: { force?: boolean }
    ) => {
      if (!note || saveInFlightRef.current) {
        return false;
      }

      if (!isOnline) {
        setStatus("offline");
        pendingRetryRef.current = true;
        persistDraft(
          draft,
          baseRevisionOverride ?? baselineRef.current?.revision ?? note.revision
        );
        return false;
      }

      if (
        !options?.force &&
        Date.now() < rateLimitedUntilRef.current
      ) {
        pendingRetryRef.current = true;
        setStatus("failed");
        persistDraft(
          draft,
          baseRevisionOverride ?? baselineRef.current?.revision ?? note.revision
        );
        return false;
      }

      saveInFlightRef.current = true;
      setStatus("saving");

      try {
        const baseRevision =
          baseRevisionOverride ?? baselineRef.current?.revision ?? note.revision;
        const response = await fetch(`/api/notes/${note.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: normalizeTitle(draft.title),
            contentMarkdown: draft.contentMarkdown,
            baseRevision,
          }),
        });

        const payload = (await response.json()) as NoteResponse | ConflictResponse;

        if (isConflictResponse(payload, response.status)) {
          persistDraft(draft, baseRevision);
          setConflict({
            serverRevision: payload.serverRevision,
            serverNote: payload.serverNote,
            localDraft: draft,
          });
          setConflictDialogOpen(true);
          setStatus("failed");
          onError?.("Another session updated this note first. Resolve the conflict to keep editing.");
          return false;
        }

        if (!response.ok || !payload.ok || !payload.data?.note) {
          if (response.status === 429 || payload.error?.code === "RATE_LIMITED") {
            rateLimitedUntilRef.current = Date.now() + RATE_LIMIT_RETRY_MS;
          }

          persistDraft(draft, baseRevision);
          pendingRetryRef.current = true;
          setStatus(isOnline ? "failed" : "offline");
          onError?.(
            payload.error?.message ||
              (response.status === 401
                ? "Your session expired. Please sign in again."
                : "Unable to save this note right now.")
          );
          return false;
        }

        rateLimitedUntilRef.current = 0;
        pendingRetryRef.current = false;
        commitSavedNote(payload.data.note);
        return true;
      } catch {
        persistDraft(
          draft,
          baseRevisionOverride ?? baselineRef.current?.revision ?? note.revision
        );
        pendingRetryRef.current = true;
        setStatus(isOnline ? "failed" : "offline");
        onError?.("Unable to save this note right now.");
        return false;
      } finally {
        saveInFlightRef.current = false;
      }
    },
    [commitSavedNote, isOnline, note, onError, persistDraft]
  );

  const retryPendingSave = useCallback(async () => {
    if (!note || !pendingRetryRef.current || !isDirty) {
      return;
    }

    await saveDraft(currentDraft);
  }, [currentDraft, isDirty, note, saveDraft]);

  const keepServerVersion = useCallback(() => {
    if (!note || !conflict) {
      return;
    }

    const serverSnapshot = conflict.serverNote;
    baselineRef.current = {
      ...note,
      title: serverSnapshot.title,
      content_markdown: serverSnapshot.contentMarkdown,
      revision: conflict.serverRevision,
    };
    setBaselineSnapshot(serverSnapshot);
    clearDraft(note.id);
    onDraftRecovered(serverSnapshot);
    setConflict(null);
    setConflictDialogOpen(false);
    pendingRetryRef.current = false;
    setStatus("saved");
  }, [clearDraft, conflict, note, onDraftRecovered]);

  const keepLocalVersion = useCallback(async () => {
    if (!note || !conflict) {
      return;
    }

    await saveDraft(conflict.localDraft, conflict.serverRevision, { force: true });
  }, [conflict, note, saveDraft]);

  useEffect(() => {
    if (!note || hydratedDraftNoteIdRef.current === note.id) {
      return;
    }

    baselineRef.current = note;
    hydratedDraftNoteIdRef.current = note.id;
    const stored = window.localStorage.getItem(getDraftStorageKey(note.id));

    if (!stored) {
      queueMicrotask(() => {
        setStatus(navigator.onLine ? "saved" : "offline");
      });
      return;
    }

    try {
      const parsed = JSON.parse(stored) as StoredDraft;
      const storedSnapshot = {
        title: parsed.title,
        contentMarkdown: parsed.contentMarkdown,
      };

      if (snapshotsEqual(storedSnapshot, noteToSnapshot(note))) {
        clearDraft(note.id);
        queueMicrotask(() => {
          setStatus(navigator.onLine ? "saved" : "offline");
        });
        return;
      }

      onDraftRecovered(storedSnapshot);
      pendingRetryRef.current = true;
      queueMicrotask(() => {
        setStatus(navigator.onLine ? "failed" : "offline");
      });
    } catch {
      clearDraft(note.id);
    }
  }, [clearDraft, note, onDraftRecovered]);

  useEffect(() => {
    if (!note) {
      return;
    }

    if (!isDirty) {
      clearDraft(note.id);
      if (!saveInFlightRef.current && !conflict) {
        setStatus(isOnline ? "saved" : "offline");
      }
      return;
    }

    persistDraft(currentDraft, baselineRef.current?.revision ?? note.revision);

    if (!isOnline) {
      pendingRetryRef.current = true;
      return;
    }

    if (conflict) {
      return;
    }

    queueMicrotask(() => {
      setStatus("saving");
    });

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void saveDraft(currentDraft);
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [clearDraft, conflict, currentDraft, isDirty, isOnline, note, persistDraft, saveDraft]);

  useEffect(() => {
    function handleOffline() {
      setIsOnline(false);
      setStatus("offline");
    }

    function handleOnline() {
      setIsOnline(true);

      if (conflict) {
        return;
      }

      if (pendingRetryRef.current) {
        void retryPendingSave();
      } else if (!isDirty) {
        setStatus("saved");
      }
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [conflict, isDirty, retryPendingSave]);

  return {
    conflict,
    conflictDialogOpen,
    hasConflict: Boolean(conflict),
    isDirty,
    isOnline,
    keepLocalVersion,
    keepServerVersion,
    lastSavedAt,
    reopenConflictDialog: () => setConflictDialogOpen(true),
    resolveManually: () => {
      setConflictDialogOpen(false);
      setStatus("failed");
    },
    retryPendingSave,
    setConflictDialogOpen,
    status,
  };
}
