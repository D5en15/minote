import "server-only";

import { createServerSupabaseClient } from "@/server/supabase/server";
import type { Plan, Subscription } from "@/types/database";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export type QuotaEntitlement = {
  plan: Plan;
  subscription: Subscription | null;
  noteLimit: number;
  dailyCreateLimit: number;
  versionRetentionDays: number;
  canPasswordShare: boolean;
  canCustomizeShare: boolean;
  isPremium: boolean;
};

function isSubscriptionEntitled(subscription: Subscription): boolean {
  if (ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    return true;
  }

  if (!subscription.grace_until) {
    return false;
  }

  return new Date(subscription.grace_until).getTime() > Date.now();
}

export async function getQuotaEntitlement(
  userId: string
): Promise<QuotaEntitlement> {
  const supabase = await createServerSupabaseClient();
  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError) {
    throw subscriptionError;
  }

  if (subscription && isSubscriptionEntitled(subscription)) {
    const { data: subscriptionPlan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", subscription.plan_id)
      .single();

    if (planError) {
      throw planError;
    }

    return {
      plan: subscriptionPlan,
      subscription,
      noteLimit: subscriptionPlan.note_limit,
      dailyCreateLimit: subscriptionPlan.daily_create_limit,
      versionRetentionDays: subscriptionPlan.version_retention_days,
      canPasswordShare: subscriptionPlan.can_password_share,
      canCustomizeShare: subscriptionPlan.can_customize_share,
      isPremium: subscriptionPlan.id !== "free",
    };
  }

  const { data: freePlan, error: freePlanError } = await supabase
    .from("plans")
    .select("*")
    .eq("id", "free")
    .single();

  if (freePlanError) {
    throw freePlanError;
  }

  return {
    plan: freePlan,
    subscription: null,
    noteLimit: freePlan.note_limit,
    dailyCreateLimit: freePlan.daily_create_limit,
    versionRetentionDays: freePlan.version_retention_days,
    canPasswordShare: freePlan.can_password_share,
    canCustomizeShare: freePlan.can_customize_share,
    isPremium: false,
  };
}
