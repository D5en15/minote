import "server-only";

export type PlanTier = "free" | "pro" | "studio";
export type BillingInterval = "forever" | "monthly" | "yearly";
export type SupportedPlanId =
  | "free"
  | "premium_monthly"
  | "premium_yearly"
  | "studio_monthly"
  | "studio_yearly";

function normalizeStripePriceId(priceId: string): string {
  return priceId.trim().toLowerCase();
}

export function getTierFromPlanId(planId: string): PlanTier {
  if (planId.startsWith("studio_")) {
    return "studio";
  }

  if (planId === "premium_monthly" || planId === "premium_yearly") {
    return "pro";
  }

  return "free";
}

export function resolvePlanIdFromStripePriceId(
  priceId: string | null | undefined
): SupportedPlanId {
  if (!priceId) {
    return "free";
  }

  const normalized = normalizeStripePriceId(priceId);
  const isYearly =
    normalized.includes("yearly") || normalized.includes("annual");

  if (normalized.includes("studio")) {
    return isYearly ? "studio_yearly" : "studio_monthly";
  }

  return isYearly ? "premium_yearly" : "premium_monthly";
}
