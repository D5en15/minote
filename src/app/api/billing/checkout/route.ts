import { NextRequest } from "next/server";
import { z } from "zod";

import { errorResponse, successResponse } from "@/server/api-response";
import { requireUser } from "@/server/auth";
import { checkoutSessionSchema } from "@/server/schemas/billing";
import { getStripeClient } from "@/lib/stripe";
import { createServiceRoleClient } from "@/server/supabase/service-role";
import { validateEnv } from "@/lib/env";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Invalid JSON body");
  }

  const payload = checkoutSessionSchema.safeParse(body);

  if (!payload.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid pricing selection", {
      details: z.flattenError(payload.error).fieldErrors,
    });
  }

  let user;

  try {
    user = await requireUser();
  } catch {
    return errorResponse("UNAUTHORIZED", "Authentication required");
  }

  try {
    const supabase = createServiceRoleClient();
    const env = validateEnv();
    const stripe = getStripeClient();

    // 1. Check or fetch current subscription status & customer ID
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subError) {
      throw subError;
    }

    let customerId = subscription?.provider_customer_id;

    // Check if mock key is being used for verification testing
    if (env.STRIPE_SECRET_KEY.startsWith("sk_test_mock")) {
      return successResponse({ url: `${env.NEXT_PUBLIC_APP_URL}/app/billing?success=true&mock=true` });
    }

    // 2. If no customer ID exists, create a Stripe customer
    if (!customerId) {
      const stripeCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = stripeCustomer.id;
    }

    // 3. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: payload.data.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${env.NEXT_PUBLIC_APP_URL}/app/billing?success=true`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/app/billing?canceled=true`,
      metadata: {
        userId: user.id,
      },
    });

    return successResponse({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return errorResponse("INTERNAL_ERROR", "Unable to initiate Stripe checkout");
  }
}
