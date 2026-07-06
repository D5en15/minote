import "server-only";

import { createServerSupabaseClient } from "@/server/supabase/server";
import { getQuotaEntitlement } from "@/server/quota";
import type { Subscription } from "@/types/database";

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getBillingStatus(userId: string) {
  const entitlement = await getQuotaEntitlement(userId);
  return {
    isPremium: entitlement.isPremium,
    planId: entitlement.plan.id,
    planName: entitlement.plan.name,
    subscriptionStatus: entitlement.subscription?.status ?? null,
    currentPeriodEnd: entitlement.subscription?.current_period_end ?? null,
    cancelAtPeriodEnd: entitlement.subscription?.cancel_at_period_end ?? false,
    graceUntil: entitlement.subscription?.grace_until ?? null,
  };
}
