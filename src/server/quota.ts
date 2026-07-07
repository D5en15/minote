import "server-only";

import { createServerSupabaseClient } from "@/server/supabase/server";
import type { Plan, Subscription } from "@/types/database";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export type QuotaEntitlement = {
  plan: Plan;
  subscription: Subscription | null;
  tier: Plan["tier"];
  noteLimit: number;
  dailyCreateLimit: number;
  maxTagsPerNote: number | null;
  versionRetentionDays: number;
  canPasswordShare: boolean;
  canCustomizeShare: boolean;
  canUseLoraShareFont: boolean;
  canHideShareBranding: boolean;
  canHideShareMetadata: boolean;
  canUseAdvancedFocus: boolean;
  canAccessPrioritySupport: boolean;
  phase2PdfExportReady: boolean;
  phase2VersionHistoryReady: boolean;
  phase2PasswordShareReady: boolean;
  phase2ShareExpirationReady: boolean;
  isInGracePeriod: boolean;
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

function isSubscriptionInGracePeriod(subscription: Subscription): boolean {
  return subscription.status === "past_due" && Boolean(subscription.grace_until);
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
      tier: subscriptionPlan.tier,
      noteLimit: subscriptionPlan.note_limit,
      dailyCreateLimit: subscriptionPlan.daily_create_limit,
      maxTagsPerNote: subscriptionPlan.max_tags_per_note,
      versionRetentionDays: subscriptionPlan.version_retention_days,
      canPasswordShare: subscriptionPlan.can_password_share,
      canCustomizeShare: subscriptionPlan.can_customize_share,
      canUseLoraShareFont: subscriptionPlan.can_use_lora_share_font,
      canHideShareBranding: subscriptionPlan.can_hide_share_branding,
      canHideShareMetadata: subscriptionPlan.can_hide_share_metadata,
      canUseAdvancedFocus: subscriptionPlan.can_use_advanced_focus,
      canAccessPrioritySupport: subscriptionPlan.can_access_priority_support,
      phase2PdfExportReady: subscriptionPlan.phase2_pdf_export_ready,
      phase2VersionHistoryReady: subscriptionPlan.phase2_version_history_ready,
      phase2PasswordShareReady: subscriptionPlan.phase2_password_share_ready,
      phase2ShareExpirationReady: subscriptionPlan.phase2_share_expiration_ready,
      isInGracePeriod: isSubscriptionInGracePeriod(subscription),
      isPremium: subscriptionPlan.tier !== "free",
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
    tier: freePlan.tier,
    noteLimit: freePlan.note_limit,
    dailyCreateLimit: freePlan.daily_create_limit,
    maxTagsPerNote: freePlan.max_tags_per_note,
    versionRetentionDays: freePlan.version_retention_days,
    canPasswordShare: freePlan.can_password_share,
    canCustomizeShare: freePlan.can_customize_share,
    canUseLoraShareFont: freePlan.can_use_lora_share_font,
    canHideShareBranding: freePlan.can_hide_share_branding,
    canHideShareMetadata: freePlan.can_hide_share_metadata,
    canUseAdvancedFocus: freePlan.can_use_advanced_focus,
    canAccessPrioritySupport: freePlan.can_access_priority_support,
    phase2PdfExportReady: freePlan.phase2_pdf_export_ready,
    phase2VersionHistoryReady: freePlan.phase2_version_history_ready,
    phase2PasswordShareReady: freePlan.phase2_password_share_ready,
    phase2ShareExpirationReady: freePlan.phase2_share_expiration_ready,
    isInGracePeriod: false,
    isPremium: false,
  };
}
