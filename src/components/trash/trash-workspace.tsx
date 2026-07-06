"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TagChip } from "@/components/notes/tag-chip";
import type { NoteWithTags } from "@/types/database";

type NotesResponse = {
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

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function TrashWorkspace() {
  const [notes, setNotes] = useState<NoteWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notePendingPermanentDelete, setNotePendingPermanentDelete] =
    useState<NoteWithTags | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadNotes() {
      const response = await fetch("/api/notes?status=trashed", {
        cache: "no-store",
      });
      const payload = (await response.json()) as NotesResponse;

      if (cancelled) {
        return;
      }

      setNotes(payload.ok ? payload.data?.notes ?? [] : []);
      setLoading(false);
    }

    void loadNotes();

    return () => {
      cancelled = true;
    };
  }, []);

  async function restoreNote(noteId: string) {
    setActionLoading(noteId);

    try {
      const response = await fetch(`/api/notes/${noteId}/restore`, {
        method: "POST",
      });
      const payload = (await response.json()) as NoteResponse;

      if (!response.ok || !payload.ok) {
        return;
      }

      setNotes((current) => current.filter((note) => note.id !== noteId));
    } finally {
      setActionLoading(null);
    }
  }

  async function permanentlyDeleteNote() {
    if (!notePendingPermanentDelete) {
      return;
    }

    setActionLoading(notePendingPermanentDelete.id);

    try {
      const response = await fetch(
        `/api/notes/${notePendingPermanentDelete.id}/permanent`,
        {
          method: "DELETE",
        }
      );
      const payload = (await response.json()) as NoteResponse;

      if (!response.ok || !payload.ok) {
        return;
      }

      setNotes((current) =>
        current.filter((note) => note.id !== notePendingPermanentDelete.id)
      );
      setNotePendingPermanentDelete(null);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-5xl">
        <div className="border-b border-border pb-5">
          <p className="text-sm text-muted-foreground">Deleted notes</p>
          <h2 className="text-2xl font-semibold">Trash</h2>
        </div>
        <div className="space-y-3 py-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="rounded-lg border border-border p-4" key={index}>
              <div className="h-5 w-1/3 rounded bg-muted" />
              <div className="mt-3 h-4 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto w-full max-w-5xl">
        <div className="border-b border-border pb-5">
          <p className="text-sm text-muted-foreground">Deleted notes</p>
          <h2 className="text-2xl font-semibold">Trash</h2>
        </div>

        {notes.length > 0 ? (
          <div className="space-y-3 py-6">
            {notes.map((note) => (
              <article
                className="rounded-lg border border-border bg-card p-4"
                key={note.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-semibold">
                      {note.title || "Untitled"}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Deleted on {formatDate(note.trashed_at)}. Permanently removed on{" "}
                      {formatDate(note.delete_after)}.
                    </p>
                    {note.tags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {note.tags.map((tag) => (
                          <TagChip key={tag.id} tag={tag} />
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      disabled={actionLoading === note.id}
                      onClick={() => void restoreNote(note.id)}
                      type="button"
                      variant="outline"
                    >
                      {actionLoading === note.id ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <RotateCcw className="size-4" aria-hidden="true" />
                      )}
                      Restore
                    </Button>
                    <Button
                      disabled={actionLoading === note.id}
                      onClick={() => setNotePendingPermanentDelete(note)}
                      type="button"
                      variant="destructive"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Delete permanently
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[22rem] items-center justify-center text-center">
            <div className="mx-auto max-w-sm">
              <div className="mx-auto grid size-12 place-items-center rounded-md border border-border bg-muted">
                <Trash2 className="size-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Trash is empty</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Deleted notes will stay here before permanent removal.
              </p>
            </div>
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(notePendingPermanentDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setNotePendingPermanentDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete permanently?</DialogTitle>
            <DialogDescription>
              This will remove the note from Trash immediately. The action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={actionLoading === notePendingPermanentDelete?.id}
              onClick={permanentlyDeleteNote}
              type="button"
              variant="destructive"
            >
              {actionLoading === notePendingPermanentDelete?.id ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              Delete permanently
            </Button>
            <Button
              disabled={actionLoading === notePendingPermanentDelete?.id}
              onClick={() => setNotePendingPermanentDelete(null)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
