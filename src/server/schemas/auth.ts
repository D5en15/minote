import { z } from "zod";

export const magicLinkRequestSchema = z.object({
  email: z.email().trim().toLowerCase(),
});

export type MagicLinkRequestInput = z.infer<typeof magicLinkRequestSchema>;
