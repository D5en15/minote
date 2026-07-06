import { z } from "zod";

export const checkoutSessionSchema = z.object({
  priceId: z.string().min(1), // Stripe Price ID (e.g. price_xxxx)
});

export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>;
