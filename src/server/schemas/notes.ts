import { z } from "zod";

const titleSchema = z.string().trim().min(1).max(200);
const contentMarkdownSchema = z.string().max(250_000);

export const noteCreateSchema = z.object({
  title: titleSchema.default("Untitled"),
  contentMarkdown: contentMarkdownSchema.default(""),
});

export const noteUpdateSchema = z
  .object({
    title: titleSchema.optional(),
    contentMarkdown: contentMarkdownSchema.optional(),
    baseRevision: z.number().int().positive(),
  })
  .refine((value) => value.title !== undefined || value.contentMarkdown !== undefined, {
    message: "At least one note field must be provided",
    path: ["title"],
  });

export type NoteCreateInput = z.infer<typeof noteCreateSchema>;
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>;
