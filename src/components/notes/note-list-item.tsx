"use client";

import { cn } from "@/lib/utils";
import type { NoteWithTags } from "@/types/database";
import { TagChip } from "@/components/notes/tag-chip";

type NoteListItemProps = {
  active: boolean;
  note: NoteWithTags;
  onSelect: (noteId: string) => void;
};

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function NoteListItem({
  active,
  note,
  onSelect,
}: NoteListItemProps) {
  return (
    <button
      className={cn(
        "block w-full rounded-md border p-3 text-left transition-colors",
        active
          ? "border-foreground/20 bg-muted"
          : "border-transparent hover:border-border hover:bg-muted/60"
      )}
      onClick={() => onSelect(note.id)}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="line-clamp-1 font-medium">{note.title || "Untitled"}</p>
        {active ? (
          <span className="mt-0.5 size-2 rounded-full bg-foreground/70" />
        ) : null}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {formatUpdatedAt(note.updated_at)}
      </p>
      {note.tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {note.tags.slice(0, 3).map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </div>
      ) : null}
    </button>
  );
}
