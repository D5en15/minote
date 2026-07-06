import { z } from "zod";

export const shareSettingsSchema = z
  .object({
    status: z.enum(["active", "revoked"]).optional(),
    accessMode: z.enum(["public", "password"]).default("public"),
    password: z.string().min(8).max(200).optional(),
    expiresAt: z.iso.datetime({ offset: true }).nullable().optional(),
  })
  .refine(
    (value) => value.accessMode !== "password" || Boolean(value.password),
    {
      message: "Password is required when accessMode is password",
      path: ["password"],
    }
  );

export type ShareSettingsInput = z.infer<typeof shareSettingsSchema>;
