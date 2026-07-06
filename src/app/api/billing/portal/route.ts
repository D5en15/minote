import { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/server/api-response";
import { requireUser } from "@/server/auth";
import { getStripeClient } from "@/lib/stripe";
import { createServiceRoleClient } from "@/server/supabase/service-role";
import { validateEnv } from "@/lib/env";

export async function POST(request: NextRequest) {
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

    // Fetch existing customer ID from subscription table
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
      return successResponse({ url: `${env.NEXT_PUBLIC_APP_URL}/app/billing?mock=true` });
    }

    // If they have no stripe customer, they can't manage a billing portal yet.
    if (!customerId) {
      // Find or create customer based on user email
      const stripeCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = stripeCustomer.id;
    }

    // Create billing portal configuration/session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.NEXT_PUBLIC_APP_URL}/app/billing`,
    });

    return successResponse({ url: session.url });
  } catch (error) {
    console.error("Stripe Portal Error:", error);
    return errorResponse("INTERNAL_ERROR", "Unable to load customer billing portal");
  }
}
