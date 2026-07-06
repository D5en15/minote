import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name must be at least 1 character long")
    .max(50, "Display name cannot exceed 50 characters")
    .transform((val) => val.trim()),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
