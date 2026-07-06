import { z } from "zod";

export const tagInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export function normalizeTagName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export type TagInput = z.infer<typeof tagInputSchema>;
