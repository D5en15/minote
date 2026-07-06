import { z } from "zod";

export const tagInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export const tagIdParamSchema = z.object({
  tagId: z.uuid(),
});

export type TagInput = z.infer<typeof tagInputSchema>;
