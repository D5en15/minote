"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { NoteWithTags, Tag } from "@/types/database";
import {
  AlertTriangle,
  Check,
  CloudOff,
  Copy,
  Download,
  ExternalLink,
  FileSearch,
  Funnel,
  Loader2,
  NotebookPen,
  Plus,
  Search,
  Share2,
  Tag as TagIcon,
  Trash2,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NoteList } from "@/components/notes/note-list";
import { useDebouncedAutosave } from "@/components/notes/use-debounced-autosave";
import { TagChip } from "@/components/notes/tag-chip";
import { GuestImportPrompt } from "@/components/guest/guest-import-prompt";

type NoteWorkspaceProps = {
  initialNoteNotFound?: boolean;
  initialSelectedNote?: NoteWithTags | null;
  selectedNoteId?: string;
};

type NotesListResponse = {
  ok: boolean;
  data?: {
    notes: NoteWithTags[];
  };
};

type NoteResponse = {
  ok: boolean;
  data?: {
    note: NoteWithTags;
  };
};

type ShareResponse = {
  ok: boolean;
  data?: {
    shareLink: NonNullable<NoteWithTags["activeShareLink"]>;
    shareUrl: string;
  };
};

type TagsResponse = {
  ok: boolean;
  data?: {
    tags: Tag[];
  };
};

type SaveIndicatorProps = {
  hasConflict: boolean;
  isDirty: boolean;
  lastSavedAt: string | null;
  onResolveConflict: () => void;
  status: "idle" | "saving" | "saved" | "failed" | "offline";
};

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function SaveIndicator({
  hasConflict,
  isDirty,
  lastSavedAt,
  onResolveConflict,
  status,
}: SaveIndicatorProps) {
  if (hasConflict) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600">
        <AlertTriangle className="size-4" aria-hidden="true" />
        <span>Conflict detected</span>
        <Button
          className="h-7 px-2 text-xs"
          onClick={onResolveConflict}
          size="sm"
          type="button"
          variant="outline"
        >
          Resolve
        </Button>
      </div>
    );
  }

  if (status === "saving") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <span>Saving</span>
      </div>
    );
  }

  if (status === "offline") {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600">
        <CloudOff className="size-4" aria-hidden="true" />
        <span>Offline</span>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertTriangle className="size-4" aria-hidden="true" />
        <span>{isDirty ? "Save failed" : "Saved draft recovery pending"}</span>
      </div>
    );
  }

  if (lastSavedAt) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600">
        <Check className="size-4" aria-hidden="true" />
        <span>Saved {formatUpdatedAt(lastSavedAt)}</span>
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">Ready</p>;
}

type NoteEditorPanelProps = {
  availableTags: Tag[];
  deleteLoading: boolean;
  note: NoteWithTags;
  onAttachTag: (name: string) => Promise<void>;
  onDetachTag: (tagId: string) => Promise<void>;
  onOpenDeleteDialog: () => void;
  onSavedNote: (note: NoteWithTags) => void;
  onShareCreated: (noteId: string, shareUrl: string) => void;
  shareUrl: string;
};

function NoteEditorPanel({
  availableTags,
  note,
  deleteLoading,
  onAttachTag,
  onDetachTag,
  onOpenDeleteDialog,
  onSavedNote,
  onShareCreated,
  shareUrl,
}: NoteEditorPanelProps) {
  const [titleDraft, setTitleDraft] = useState(note.title);
  const [contentDraft, setContentDraft] = useState(note.content_markdown);
  const [tagDraft, setTagDraft] = useState("");
  const [tagLoading, setTagLoading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const autosave = useDebouncedAutosave({
    note,
    title: titleDraft,
    contentMarkdown: contentDraft,
    onDraftRecovered: (draft) => {
      setTitleDraft(draft.title);
      setContentDraft(draft.contentMarkdown);
    },
    onSaved: (savedNote) => {
      setTitleDraft(savedNote.title);
      setContentDraft(savedNote.content_markdown);
      onSavedNote(savedNote);
    },
  });

  const suggestedTags = availableTags.filter(
    (tag) =>
      !note.tags.some((noteTag) => noteTag.id === tag.id) &&
      (!tagDraft.trim() ||
          tag.normalized_name.includes(tagDraft.trim().toLowerCase()))
  );

  async function handleAttachTag() {
    const value = tagDraft.trim();

    if (!value || tagLoading) {
      return;
    }

    setTagLoading(true);

    try {
      await onAttachTag(value);
      setTagDraft("");
    } finally {
      setTagLoading(false);
    }
  }

  async function handleDetachTag(tagId: string) {
    if (tagLoading) {
      return;
    }

    setTagLoading(true);

    try {
      await onDetachTag(tagId);
    } finally {
      setTagLoading(false);
    }
  }

  async function createShareLink() {
    setShareLoading(true);
    setShareError("");

    try {
      const response = await fetch(`/api/notes/${note.id}/share`, {
        method: "POST",
      });
      const payload = (await response.json()) as ShareResponse;

      if (!response.ok || !payload.ok || !payload.data) {
        setShareError("Unable to create share link");
        return;
      }

      onShareCreated(note.id, payload.data.shareUrl);
      onSavedNote({
        ...note,
        activeShareLink: payload.data.shareLink,
      });
    } finally {
      setShareLoading(false);
    }
  }

  async function regenerateShareLink() {
    setShareLoading(true);
    setShareError("");

    try {
      const response = await fetch(`/api/notes/${note.id}/share/regenerate`, {
        method: "POST",
      });
      const payload = (await response.json()) as ShareResponse;

      if (!response.ok || !payload.ok || !payload.data) {
        setShareError("Unable to regenerate share link");
        return;
      }

      onShareCreated(note.id, payload.data.shareUrl);
      onSavedNote({
        ...note,
        activeShareLink: payload.data.shareLink,
      });
    } finally {
      setShareLoading(false);
    }
  }

  async function revokeShareLink() {
    setShareLoading(true);
    setShareError("");

    try {
      const response = await fetch(`/api/notes/${note.id}/share`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setShareError("Unable to revoke share link");
        return;
      }

      onShareCreated(note.id, "");
      onSavedNote({
        ...note,
        activeShareLink: null,
      });
    } finally {
      setShareLoading(false);
    }
  }

  async function copyShareLink() {
    if (!shareUrl) {
      setShareError("Generate the current share link again before copying.");
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
  }

  async function handleExportMarkdown() {
    if (exportLoading) return;
    setExportLoading(true);
    try {
      const response = await fetch(`/api/notes/${note.id}/export`);
      if (!response.ok) {
        throw new Error("Failed to export note");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "exported-note.md";
      if (contentDisposition) {
        const matches = /filename\*=UTF-8''(.+)/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = decodeURIComponent(matches[1]);
        } else {
          const filenameMatch = /filename="(.+)"/.exec(contentDisposition);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">
            Updated {formatUpdatedAt(note.updated_at)}
          </p>
          <SaveIndicator
            hasConflict={autosave.hasConflict}
            isDirty={autosave.isDirty}
            lastSavedAt={autosave.lastSavedAt}
            onResolveConflict={autosave.reopenConflictDialog}
            status={autosave.status}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={exportLoading}
            onClick={handleExportMarkdown}
            size="sm"
            type="button"
            variant="outline"
          >
            {exportLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
            Export
          </Button>
          <Button
            onClick={() => setShareDialogOpen(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            <Share2 className="size-4" aria-hidden="true" />
            Share
          </Button>
          <Button
            disabled={deleteLoading}
            onClick={onOpenDeleteDialog}
            size="sm"
            type="button"
            variant="outline"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className="mx-auto flex h-full max-w-4xl flex-col gap-4">
          <Input
            className="h-11 border-transparent px-0 text-2xl font-semibold shadow-none focus-visible:border-transparent focus-visible:ring-0"
            onChange={(event) => setTitleDraft(event.target.value)}
            placeholder="Untitled"
            value={titleDraft}
          />
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                <TagIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
                  onChange={(event) => setTagDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleAttachTag();
                    }
                  }}
                  placeholder="Add a tag"
                  value={tagDraft}
                />
              </div>
              <Button
                disabled={tagLoading || !tagDraft.trim()}
                onClick={() => void handleAttachTag()}
                size="sm"
                type="button"
                variant="outline"
              >
                Add tag
              </Button>
            </div>
            {note.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <TagChip
                    key={tag.id}
                    onRemove={() => void handleDetachTag(tag.id)}
                    tag={tag}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No tags yet for this note.
              </p>
            )}
            {suggestedTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {suggestedTags.slice(0, 6).map((tag) => (
                  <TagChip
                    key={tag.id}
                    onClick={() => {
                      setTagDraft(tag.name);
                    }}
                    tag={tag}
                  />
                ))}
              </div>
            ) : null}
          </div>
          <Textarea
            className="min-h-[26rem] flex-1 resize-none border-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
            onChange={(event) => setContentDraft(event.target.value)}
            placeholder="Start writing..."
            value={contentDraft}
          />
        </div>
      </div>

      <Dialog
        open={autosave.conflictDialogOpen}
        onOpenChange={autosave.setConflictDialogOpen}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Resolve note conflict</DialogTitle>
            <DialogDescription>
              Another session saved this note first. Compare both versions before
              deciding which one to keep.
            </DialogDescription>
          </DialogHeader>
          {autosave.conflict ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-medium">Server version</p>
                <Input readOnly value={autosave.conflict.serverNote.title} />
                <Textarea
                  className="min-h-72 resize-none"
                  readOnly
                  value={autosave.conflict.serverNote.contentMarkdown}
                />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium">Local draft</p>
                <Input readOnly value={autosave.conflict.localDraft.title} />
                <Textarea
                  className="min-h-72 resize-none"
                  readOnly
                  value={autosave.conflict.localDraft.contentMarkdown}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              onClick={autosave.resolveManually}
              type="button"
              variant="outline"
            >
              <Copy className="size-4" aria-hidden="true" />
              Manual copy/merge
            </Button>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                onClick={autosave.keepServerVersion}
                type="button"
                variant="outline"
              >
                Keep server
              </Button>
              <Button onClick={autosave.keepLocalVersion} type="button">
                Keep mine
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share note</DialogTitle>
            <DialogDescription>
              Shared notes are read-only and hidden from search engines by default.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
              {note.activeShareLink ? "Share link is active." : "Share link is not active."}
            </div>
            <Input
              readOnly
              value={shareUrl || "Generate a share link to copy it."}
            />
            {shareError ? (
              <p className="text-sm text-destructive">{shareError}</p>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              disabled={shareLoading || !shareUrl}
              onClick={() => void copyShareLink()}
              type="button"
              variant="outline"
            >
              <Copy className="size-4" aria-hidden="true" />
              Copy share link
            </Button>
            <div className="flex flex-wrap justify-end gap-2">
              {note.activeShareLink ? (
                <>
                  <Button
                    disabled={shareLoading}
                    onClick={revokeShareLink}
                    type="button"
                    variant="outline"
                  >
                    {shareLoading ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="size-4" aria-hidden="true" />
                    )}
                    Revoke
                  </Button>
                  <Button disabled={shareLoading} onClick={regenerateShareLink} type="button">
                    {shareLoading ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ExternalLink className="size-4" aria-hidden="true" />
                    )}
                    Regenerate
                  </Button>
                </>
              ) : (
                <Button disabled={shareLoading} onClick={createShareLink} type="button">
                  {shareLoading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Share2 className="size-4" aria-hidden="true" />
                  )}
                  Create share link
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function NoteWorkspace({
  initialNoteNotFound = false,
  initialSelectedNote = null,
  selectedNoteId,
}: NoteWorkspaceProps) {
  const router = useRouter();
  const [isRouting, startRouting] = useTransition();
  const [notes, setNotes] = useState<NoteWithTags[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteWithTags | null>(
    initialSelectedNote
  );
  const [noteLoading, setNoteLoading] = useState(
    Boolean(selectedNoteId && !initialSelectedNote && !initialNoteNotFound)
  );
  const [noteNotFound, setNoteNotFound] = useState(initialNoteNotFound);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [shareUrlsByNoteId, setShareUrlsByNoteId] = useState<Record<string, string>>({});

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotes() {
      setNotesLoading(true);

      const params = new URLSearchParams();
      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }
      if (selectedTagId) {
        params.set("tag", selectedTagId);
      }

      const response = await fetch(`/api/notes?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as NotesListResponse;

      if (cancelled) {
        return;
      }

      setNotes(payload.ok ? payload.data?.notes ?? [] : []);
      setNotesLoading(false);
    }

    loadNotes();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, selectedTagId]);

  useEffect(() => {
    let cancelled = false;

    async function loadTags() {
      setTagsLoading(true);
      const response = await fetch("/api/tags", {
        cache: "no-store",
      });
      const payload = (await response.json()) as TagsResponse;

      if (cancelled) {
        return;
      }

      setAvailableTags(payload.ok ? payload.data?.tags ?? [] : []);
      setTagsLoading(false);
    }

    loadTags();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadNote() {
      if (!selectedNoteId) {
        setSelectedNote(null);
        setNoteLoading(false);
        setNoteNotFound(false);
        return;
      }

      setNoteLoading(true);
      setNoteNotFound(false);

      if (initialSelectedNote?.id === selectedNoteId) {
        setSelectedNote(initialSelectedNote);
        setNoteLoading(false);
        return;
      }

      const response = await fetch(`/api/notes/${selectedNoteId}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as NoteResponse;

      if (cancelled) {
        return;
      }

      if (!response.ok || !payload.ok || !payload.data?.note) {
        setSelectedNote(null);
        setNoteLoading(false);
        setNoteNotFound(true);
        return;
      }

      setSelectedNote(payload.data.note);
      setNoteLoading(false);
    }

    loadNote();

    return () => {
      cancelled = true;
    };
  }, [initialSelectedNote, initialNoteNotFound, selectedNoteId]);

  async function createNote() {
    setCreateLoading(true);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Untitled",
          contentMarkdown: "",
        }),
      });
      const payload = (await response.json()) as NoteResponse;

      if (!response.ok || !payload.ok || !payload.data?.note) {
        return;
      }

      setNotes((current) => [payload.data!.note, ...current]);
      startRouting(() => {
        router.push(`/app/notes/${payload.data!.note.id}`);
      });
    } finally {
      setCreateLoading(false);
    }
  }

  async function deleteNote() {
    if (!selectedNote) {
      return;
    }

    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/notes/${selectedNote.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as NoteResponse;

      if (!response.ok || !payload.ok) {
        return;
      }

      setNotes((current) => current.filter((note) => note.id !== selectedNote.id));
      setDeleteDialogOpen(false);
      startRouting(() => {
        router.push("/app");
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  async function reloadTags() {
    const response = await fetch("/api/tags", {
      cache: "no-store",
    });
    const payload = (await response.json()) as TagsResponse;

    if (!response.ok || !payload.ok) {
      return;
    }

    setAvailableTags(payload.data?.tags ?? []);
  }

  function applySavedNote(savedNote: NoteWithTags) {
    setSelectedNote(savedNote);
    setNotes((current) => {
      const existing = current.some((note) => note.id === savedNote.id);
      const next = existing
        ? current.map((note) => (note.id === savedNote.id ? savedNote : note))
        : [savedNote, ...current];

      return [...next].sort(
        (left, right) =>
          new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
      );
    });
  }

  async function attachTag(name: string) {
    if (!selectedNote) {
      return;
    }

    const response = await fetch(`/api/notes/${selectedNote.id}/tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });
    const payload = (await response.json()) as NoteResponse;

    if (!response.ok || !payload.ok || !payload.data?.note) {
      return;
    }

    applySavedNote(payload.data.note);
    await reloadTags();
  }

  async function detachTag(tagId: string) {
    if (!selectedNote) {
      return;
    }

    const response = await fetch(`/api/notes/${selectedNote.id}/tags/${tagId}`, {
      method: "DELETE",
    });
    const payload = (await response.json()) as NoteResponse;

    if (!response.ok || !payload.ok || !payload.data?.note) {
      return;
    }

    applySavedNote(payload.data.note);
    await reloadTags();
  }

  return (
    <>
      <GuestImportPrompt
        onImported={() => {
          router.refresh();
        }}
      />
      <section className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-[96rem] flex-col gap-4 lg:grid lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="flex min-h-[24rem] flex-col rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">All notes</p>
                <h2 className="text-lg font-semibold">Workspace</h2>
              </div>
              <Button
                disabled={createLoading}
                onClick={createNote}
                size="sm"
                type="button"
              >
                {createLoading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="size-4" aria-hidden="true" />
                )}
                New note
              </Button>
            </div>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notes"
                value={search}
              />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Funnel className="size-4" aria-hidden="true" />
                <span>Filter by tag</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`rounded-md border px-2 py-1 text-xs ${
                    selectedTagId === null
                      ? "border-foreground/20 bg-muted text-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                  onClick={() => setSelectedTagId(null)}
                  type="button"
                >
                  All tags
                </button>
                {tagsLoading ? (
                  <span className="text-xs text-muted-foreground">Loading tags...</span>
                ) : availableTags.length > 0 ? (
                  availableTags.map((tag) => (
                    <TagChip
                      active={tag.id === selectedTagId}
                      key={tag.id}
                      onClick={() =>
                        setSelectedTagId((current) =>
                          current === tag.id ? null : tag.id
                        )
                      }
                      tag={tag}
                    />
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No tags available
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <NoteList
              loading={notesLoading}
              notes={notes}
              onSelect={(noteId) =>
                startRouting(() => {
                  router.push(`/app/notes/${noteId}`);
                })
              }
              search={debouncedSearch}
              selectedNoteId={selectedNoteId}
            />
          </div>
        </aside>

        <section className="flex min-h-[32rem] flex-col rounded-lg border border-border bg-card">
          {selectedNoteId ? (
            noteLoading ? (
              <div className="space-y-4 p-5">
                <div className="h-10 rounded-md bg-muted" />
                <div className="h-72 rounded-md bg-muted" />
              </div>
            ) : noteNotFound ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center">
                <div className="max-w-sm">
                  <div className="mx-auto grid size-10 place-items-center rounded-md border border-border bg-muted">
                    <FileSearch
                      className="size-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mt-3 font-medium">Note not found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The note could not be loaded or you no longer have access.
                  </p>
                </div>
              </div>
            ) : selectedNote ? (
              <NoteEditorPanel
                key={selectedNote.id}
                availableTags={availableTags}
                deleteLoading={deleteLoading}
                note={selectedNote}
                onAttachTag={attachTag}
                onDetachTag={detachTag}
                onOpenDeleteDialog={() => setDeleteDialogOpen(true)}
                onSavedNote={applySavedNote}
                onShareCreated={(noteId, shareUrl) => {
                  setShareUrlsByNoteId((current) => ({
                    ...current,
                    [noteId]: shareUrl,
                  }));
                }}
                shareUrl={shareUrlsByNoteId[selectedNote.id] ?? ""}
              />
            ) : null
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div className="max-w-sm">
                <div className="mx-auto grid size-10 place-items-center rounded-md border border-border bg-muted">
                  <NotebookPen
                    className="size-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-3 font-medium">Select a note</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a note from the list or create a new one to open the editor.
                </p>
              </div>
            </div>
          )}
        </section>
      </section>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this note?</DialogTitle>
            <DialogDescription>
              The note will move to Trash and can be restored later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={deleteLoading}
              onClick={deleteNote}
              type="button"
              variant="destructive"
            >
              {deleteLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              Delete
            </Button>
            <Button
              disabled={deleteLoading}
              onClick={() => setDeleteDialogOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isRouting ? (
        <div className="fixed right-4 bottom-4 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground shadow-md">
          Loading...
        </div>
      ) : null}
    </>
  );
}
