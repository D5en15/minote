import Stripe from "stripe";
import { validateEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const env = validateEnv();
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-01-27.acacia" as any, // standard robust api version matching the environment or latest SDK
      typescript: true,
    });
  }
  return stripeClient;
}
