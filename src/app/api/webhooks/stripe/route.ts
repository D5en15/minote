import { NextRequest } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";

import { errorResponse, successResponse } from "@/server/api-response";
import { getStripeClient } from "@/lib/stripe";
import { validateEnv } from "@/lib/env";
import { createServiceRoleClient } from "@/server/supabase/service-role";
import { writeAuditLog } from "@/server/audit";
import { AUDIT_ENTITIES, AUDIT_EVENTS } from "@/server/audit-events";
import type { SubscriptionStatus } from "@/types/database";

// Map Stripe subscription status to our database schema status
const STRIPE_STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "active",
  trialing: "trialing",
  past_due: "past_due",
  canceled: "canceled",
  unpaid: "payment_failed",
  incomplete: "payment_failed",
  incomplete_expired: "expired",
  paused: "canceled",
};

export async function POST(request: NextRequest) {
  const env = validateEnv();
  const stripe = getStripeClient();
  const headerList = await headers();
  const signature = headerList.get("stripe-signature");

  if (!signature) {
    return errorResponse("BAD_REQUEST", "Missing stripe signature header");
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Stripe Webhook Signature Verification Failed:", error);
    return errorResponse("BAD_REQUEST", "Stripe signature validation failed");
  }

  const supabase = createServiceRoleClient();

  try {
    // 1. Webhook Idempotency validation
    const { data: existingEvent, error: existingEventError } = await supabase
      .from("stripe_events")
      .select("*")
      .eq("id", event.id)
      .maybeSingle();

    if (existingEventError) {
      throw existingEventError;
    }

    if (existingEvent) {
      return successResponse({ processed: true, message: "Duplicate event ignored" });
    }

    // Insert event to lock processing
    const { error: insertEventError } = await supabase
      .from("stripe_events")
      .insert({
        id: event.id,
        type: event.type,
        processed_at: new Date().toISOString(),
        payload: event.data.object as any,
      });

    if (insertEventError) {
      throw insertEventError;
    }

    // 2. Audit logs for event receipt
    await writeAuditLog({
      eventType: AUDIT_EVENTS.BILLING_WEBHOOK_RECEIVED,
      entityType: AUDIT_ENTITIES.SYSTEM,
      entityId: null, // event.id is text/non-uuid, whereas entity_id is uuid column in audit_logs
      metadata: {
        eventId: event.id,
        eventType: event.type,
      },
    });

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const stripeSub = event.data.object as any;
      const stripeCustomerId = stripeSub.customer as string;

      // Extract metadata or find user ID from Stripe customer
      let userId = stripeSub.metadata?.userId;
      if (!userId) {
        const customer = await stripe.customers.retrieve(stripeCustomerId);
        if ("deleted" in customer) {
          throw new Error("Customer has been deleted on Stripe");
        }
        userId = customer.metadata?.userId;
      }

      if (!userId) {
        throw new Error(`User ID not found for Stripe customer: ${stripeCustomerId}`);
      }

      // Map Plan ID from subscription pricing plan
      const priceId = stripeSub.items.data[0]?.price.id;
      // Define plans mapping logic: free, premium_monthly, premium_yearly
      // (For verification script, let's map stripe pricing product identifiers or match IDs)
      let planId = "free";
      if (priceId) {
        if (priceId.includes("yearly") || priceId.includes("year")) {
          planId = "premium_yearly";
        } else {
          planId = "premium_monthly";
        }
      }

      const status: SubscriptionStatus = STRIPE_STATUS_MAP[stripeSub.status] ?? "payment_failed";
      const currentPeriodStart = new Date((stripeSub.current_period_start as number) * 1000).toISOString();
      const currentPeriodEnd = new Date((stripeSub.current_period_end as number) * 1000).toISOString();
      const cancelAtPeriodEnd = stripeSub.cancel_at_period_end;
      const graceUntil = status === "past_due" ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null; // 7 days grace

      // Upsert subscription
      const { data: existingSub, error: subSelectError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (subSelectError) {
        throw subSelectError;
      }

      let subUpsertError;
      if (existingSub) {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan_id: planId,
            provider_customer_id: stripeCustomerId,
            provider_subscription_id: stripeSub.id,
            status,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: cancelAtPeriodEnd,
            grace_until: graceUntil,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSub.id);
        subUpsertError = error;
      } else {
        const { error } = await supabase
          .from("subscriptions")
          .insert({
            user_id: userId,
            plan_id: planId,
            provider: "stripe",
            provider_customer_id: stripeCustomerId,
            provider_subscription_id: stripeSub.id,
            status,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: cancelAtPeriodEnd,
            grace_until: graceUntil,
          });
        subUpsertError = error;
      }

      if (subUpsertError) {
        throw subUpsertError;
      }

      // Audit logs for subscription status update
      await writeAuditLog({
        actorUserId: userId,
        eventType: AUDIT_EVENTS.BILLING_SUBSCRIPTION_UPDATED,
        entityType: AUDIT_ENTITIES.SUBSCRIPTION,
        entityId: null, // stripeSub.id is not a UUID
        metadata: {
          subscriptionId: stripeSub.id,
          status,
          planId,
        },
      });
    }

    return successResponse({ processed: true });
  } catch (error) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    // Log error to observability pipeline (17.6)
    const { logError } = await import("@/server/logger");
    await logError({
      message: errObj.message,
      severity: "error",
      context: "stripe_webhook",
      errorStack: errObj.stack,
    });
    console.error("Stripe Webhook Processing Error:", error);
    return errorResponse("INTERNAL_ERROR", "Stripe webhook execution failure");
  }
}
