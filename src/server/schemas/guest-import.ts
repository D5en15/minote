import { z } from "zod";

import { tagInputSchema } from "@/server/schemas/tags";

export const guestImportNoteSchema = z.object({
  localId: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  contentMarkdown: z.string().max(250_000),
  tags: z.array(tagInputSchema.shape.name).max(20).default([]),
});

export const guestImportSchema = z.object({
  notes: z.array(guestImportNoteSchema).min(1).max(200),
});

export type GuestImportInput = z.infer<typeof guestImportSchema>;
