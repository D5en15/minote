import "server-only";

import { escapeHtml } from "@/server/sanitize";
import type { Note } from "@/types/database";

export type ExportedMarkdown = {
  filename: string;
  content: string;
};

/**
 * Generates a safe filename from a note's title.
 */
export function generateSafeFilename(title: string): string {
  const normalized = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0e00-\u0e7f_-\s]/g, "") // Allow Thai characters (\u0e00-\u0e7f), alpha-numeric, space, underscore, and dash
    .replace(/\s+/g, "-")
    .slice(0, 50);

  return `${normalized || "untitled"}.md`;
}

/**
 * Prepares a note for export by sanitizing the content and generating markdown.
 */
export function exportNoteToMarkdown(note: Note): ExportedMarkdown {
  const filename = generateSafeFilename(note.title);
  // Escaping dangerous HTML tags in general markdown export since markdown might render HTML in some environments.
  const sanitizedContent = escapeHtml(note.content_markdown);

  return {
    filename,
    content: sanitizedContent,
  };
}
