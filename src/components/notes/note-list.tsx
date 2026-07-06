"use client";

import { FileSearch } from "lucide-react";

import type { NoteWithTags } from "@/types/database";
import { NoteListItem } from "@/components/notes/note-list-item";

type NoteListProps = {
  loading: boolean;
  notes: NoteWithTags[];
  search: string;
  selectedNoteId?: string;
  onSelect: (noteId: string) => void;
};

export function NoteList({
  loading,
  notes,
  search,
  selectedNoteId,
  onSelect,
}: NoteListProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className="rounded-md border border-border bg-background p-3"
            key={index}
          >
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex h-full min-h-56 items-center justify-center p-6 text-center">
        <div className="max-w-xs">
          <div className="mx-auto grid size-10 place-items-center rounded-md border border-border bg-muted">
            <FileSearch className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="mt-3 font-medium">
            {search.trim() ? "No matching notes" : "No notes yet"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search.trim()
              ? "Try another search term."
              : "Create your first note to start writing."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <NoteListItem
          active={note.id === selectedNoteId}
          key={note.id}
          note={note}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
