"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Tag } from "@/types/database";

type TagChipProps = {
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  tag: Tag;
};

export function TagChip({ active = false, onClick, onRemove, tag }: TagChipProps) {
  return (
    <div
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs",
        active
          ? "border-foreground/20 bg-muted text-foreground"
          : "border-border bg-background text-muted-foreground"
      )}
    >
      <button
        className="max-w-32 truncate text-left"
        onClick={onClick}
        type="button"
      >
        {tag.name}
      </button>
      {onRemove ? (
        <button
          className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={onRemove}
          type="button"
        >
          <X className="size-3" aria-hidden="true" />
          <span className="sr-only">Remove {tag.name}</span>
        </button>
      ) : null}
    </div>
  );
}
