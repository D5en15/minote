import "server-only";

import { getQuotaEntitlement, type QuotaEntitlement } from "@/server/quota";

export type FeatureName =
  | "share.serif_font"
  | "share.hide_branding"
  | "share.hide_metadata"
  | "share.hide_theme_toggle"
  | "focus.advanced"
  | "support.priority"
  | "phase2.pdf_export"
  | "phase2.version_history"
  | "phase2.password_share"
  | "phase2.share_expiration";

export function checkFeatureAccess(
  entitlement: QuotaEntitlement,
  feature: FeatureName
): boolean {
  switch (feature) {
    case "share.serif_font":
      return entitlement.canUseLoraShareFont;
    case "share.hide_branding":
      return entitlement.canHideShareBranding;
    case "share.hide_metadata":
    case "share.hide_theme_toggle":
      return entitlement.canHideShareMetadata;
    case "focus.advanced":
      return entitlement.canUseAdvancedFocus;
    case "support.priority":
      return entitlement.canAccessPrioritySupport;
    case "phase2.pdf_export":
      return entitlement.phase2PdfExportReady;
    case "phase2.version_history":
      return entitlement.phase2VersionHistoryReady;
    case "phase2.password_share":
      return entitlement.phase2PasswordShareReady;
    case "phase2.share_expiration":
      return entitlement.phase2ShareExpirationReady;
  }
}

export async function getFeatureAccess(userId: string) {
  const entitlement = await getQuotaEntitlement(userId);

  return {
    entitlement,
    has(feature: FeatureName) {
      return checkFeatureAccess(entitlement, feature);
    },
  };
}
