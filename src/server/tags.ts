import "server-only";

export const MAX_TAGS_PER_NOTE = 20;

export function normalizeTagName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}
