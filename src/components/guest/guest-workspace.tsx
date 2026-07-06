"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CloudUpload,
  FileText,
  Loader2,
  Plus,
  TriangleAlert,
} from "lucide-react";

import {
  createGuestNote,
  readGuestNotes,
  writeGuestNotes,
} from "@/lib/guest-notes";
import { cn } from "@/lib/utils";
import type { GuestNote } from "@/types/guest-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoginPanel } from "@/components/auth/login-panel";

const AUTOSAVE_DELAY_MS = 1_000;

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeTagDraft(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .slice(0, 20);
}

type GuestNoteListItemProps = {
  active: boolean;
  note: GuestNote;
  onSelect: (localId: string) => void;
};

function GuestNoteListItem({ active, note, onSelect }: GuestNoteListItemProps) {
  return (
    <button
      className={cn(
        "block w-full rounded-md border p-3 text-left transition-colors",
        active
          ? "border-foreground/20 bg-muted"
          : "border-transparent hover:border-border hover:bg-muted/60"
      )}
      onClick={() => onSelect(note.localId)}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="line-clamp-1 font-medium">{note.title || "Untitled"}</p>
        {active ? <span className="mt-0.5 size-2 rounded-full bg-foreground/70" /> : null}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {formatUpdatedAt(note.updatedAt)}
      </p>
    </button>
  );
}

type GuestEditorPanelProps = {
  note: GuestNote;
  onSave: (note: GuestNote) => void;
};

function GuestEditorPanel({ note, onSave }: GuestEditorPanelProps) {
  const [titleDraft, setTitleDraft] = useState(note.title);
  const [contentDraft, setContentDraft] = useState(note.contentMarkdown);
  const [tagsDraft, setTagsDraft] = useState(note.tags.join(", "));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("saved");

  useEffect(() => {
    queueMicrotask(() => {
      setSaveState("saving");
    });

    const timeoutId = window.setTimeout(() => {
      const nextNote: GuestNote = {
        ...note,
        title: titleDraft.trim() || "Untitled",
        contentMarkdown: contentDraft,
        tags: normalizeTagDraft(tagsDraft),
        updatedAt: new Date().toISOString(),
      };

      onSave(nextNote);
      setSaveState("saved");
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [contentDraft, note, onSave, tagsDraft, titleDraft]);

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Updated {formatUpdatedAt(note.updatedAt)}
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {saveState === "saving" ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>Saving locally</span>
            </>
          ) : (
            <>
              <CloudUpload className="size-4" aria-hidden="true" />
              <span>Saved in browser</span>
            </>
          )}
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
          <Input
            className="border-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
            onChange={(event) => setTagsDraft(event.target.value)}
            placeholder="Tags, separated by commas"
            value={tagsDraft}
          />
          <Textarea
            className="min-h-[26rem] flex-1 resize-none border-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
            onChange={(event) => setContentDraft(event.target.value)}
            placeholder="Start writing..."
            value={contentDraft}
          />
        </div>
      </div>
    </>
  );
}

function loadInitialGuestNotes() {
  return typeof window === "undefined" ? [] : readGuestNotes();
}

export function GuestWorkspace() {
  const [notes, setNotes] = useState<GuestNote[]>(loadInitialGuestNotes);
  const [selectedLocalId, setSelectedLocalId] = useState<string | null>(() => {
    const initialNotes = loadInitialGuestNotes();
    return initialNotes[0]?.localId ?? null;
  });

  const selectedNote = useMemo(
    () => notes.find((note) => note.localId === selectedLocalId) ?? null,
    [notes, selectedLocalId]
  );

  function createNoteAndSelect() {
    const nextNote = createGuestNote();
    const nextNotes = [nextNote, ...notes];
    setNotes(nextNotes);
    writeGuestNotes(nextNotes);
    setSelectedLocalId(nextNote.localId);
  }

  function handleSave(nextNote: GuestNote) {
    setNotes((current) => {
      const nextNotes = current.map((note) =>
        note.localId === nextNote.localId ? nextNote : note
      );
      writeGuestNotes(nextNotes);
      return nextNotes;
    });
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            Minote
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TriangleAlert className="size-4" aria-hidden="true" />
            <span>Guest drafts live only in this browser until you import them.</span>
          </div>
        </nav>

        <div className="mt-8 grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)_22rem]">
          <aside className="flex min-h-[32rem] flex-col rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <p className="text-sm text-muted-foreground">Guest notes</p>
                <h2 className="text-lg font-semibold">Local drafts</h2>
              </div>
              <Button onClick={createNoteAndSelect} size="sm" type="button">
                <Plus className="size-4" aria-hidden="true" />
                New
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {notes.length > 0 ? (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <GuestNoteListItem
                      active={note.localId === selectedLocalId}
                      key={note.localId}
                      note={note}
                      onSelect={setSelectedLocalId}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-full min-h-56 items-center justify-center p-6 text-center">
                  <div className="max-w-xs">
                    <div className="mx-auto grid size-10 place-items-center rounded-md border border-border bg-muted">
                      <AlertTriangle className="size-5 text-muted-foreground" />
                    </div>
                    <p className="mt-3 font-medium">No guest notes yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Press &quot;New&quot; or &quot;ทดลองจดทันที&quot; to create your first local draft.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-[32rem] flex-col rounded-lg border border-border bg-card">
            {selectedNote ? (
              <GuestEditorPanel key={selectedNote.localId} note={selectedNote} onSave={handleSave} />
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center">
                <div className="max-w-sm">
                  <div className="mx-auto grid size-10 place-items-center rounded-md border border-border bg-muted">
                    <FileText className="size-5 text-muted-foreground" />
                  </div>
                  <p className="mt-3 font-medium">Guest workspace ready</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start a local draft now, then sign in later to import it into your cloud workspace.
                  </p>
                  <Button className="mt-4" onClick={createNoteAndSelect} type="button">
                    ทดลองจดทันที
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            )}
          </section>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Save to cloud</p>
                <h2 className="text-lg font-semibold">Login or register</h2>
              </div>
              <LoginPanel guestNotesCount={notes.length} />
            </div>
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <p className="text-sm font-medium">Guest mode warning</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Guest drafts are stored in this browser only. Clearing browser data,
                using another device, or switching browsers can remove them before import.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
