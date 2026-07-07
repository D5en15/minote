import "server-only";

import { AUDIT_ENTITIES, AUDIT_EVENTS } from "@/server/audit-events";
import { writeAuditLog } from "@/server/audit";
import { checkFeatureAccess, getFeatureAccess } from "@/server/features";
import { getAppBaseUrl, getClientIp, getUserAgent } from "@/server/request";
import { assertNoteOwner } from "@/server/services/notes";
import {
  createShareLink,
  getActiveShareLinkByNoteId,
  getPublicSharedNoteByNoteId,
  lookupActiveShareByTokenHash,
  revokeShareLink,
  touchShareLinkAccessed,
  updateShareLinkSettings,
  type ActiveShareLinkSummary,
} from "@/server/repositories/shares";
import { hashShareToken } from "@/server/security/hash";
import { generateShareToken } from "@/server/security/token";
import type { ShareFontFamily } from "@/types/database";
import type { NextRequest } from "next/server";

export type ShareMutationResult = {
  shareLink: ActiveShareLinkSummary;
  shareUrl: string;
};

export type ShareSettingsInput = {
  fontFamily?: ShareFontFamily;
  showBranding?: boolean;
  showThemeToggle?: boolean;
  showCreatedAt?: boolean;
};

function normalizeShareSettings(
  settings: ShareSettingsInput | undefined,
  entitlement: Awaited<ReturnType<typeof getFeatureAccess>>["entitlement"]
) : {
  fontFamily: ShareFontFamily;
  showBranding: boolean;
  showThemeToggle: boolean;
  showCreatedAt: boolean;
} {
  const requestedFont = settings?.fontFamily === "lora" ? "lora" : "poppins";

  return {
    fontFamily: checkFeatureAccess(entitlement, "share.serif_font")
      ? requestedFont
      : "poppins",
    showBranding: checkFeatureAccess(entitlement, "share.hide_branding")
      ? settings?.showBranding ?? true
      : true,
    showThemeToggle: checkFeatureAccess(entitlement, "share.hide_theme_toggle")
      ? settings?.showThemeToggle ?? true
      : true,
    showCreatedAt: checkFeatureAccess(entitlement, "share.hide_metadata")
      ? settings?.showCreatedAt ?? true
      : true,
  };
}

export async function createNoteShare(
  noteId: string,
  userId: string,
  settings?: ShareSettingsInput,
  request?: NextRequest
): Promise<ShareMutationResult | null> {
  const note = await assertNoteOwner(noteId);

  if (!note || note.user_id !== userId || note.status !== "active") {
    return null;
  }

  const activeShare = await getActiveShareLinkByNoteId(noteId);

  if (activeShare) {
    throw new Error("SHARE_ALREADY_ACTIVE");
  }

  const featureAccess = await getFeatureAccess(userId);
  const normalizedSettings = normalizeShareSettings(
    settings,
    featureAccess.entitlement
  );
  const token = generateShareToken();
  const shareLink = await createShareLink({
    noteId,
    userId,
    tokenHash: hashShareToken(token),
    ...normalizedSettings,
  });

  await writeAuditLog({
    actorUserId: userId,
    eventType: AUDIT_EVENTS.SHARE_CREATED,
    entityType: AUDIT_ENTITIES.SHARE_LINK,
    entityId: shareLink.id,
    ipAddress: request ? getClientIp(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    metadata: {
      noteId,
      accessMode: shareLink.access_mode,
    },
  });

  return {
    shareLink: {
      id: shareLink.id,
      accessMode: shareLink.access_mode,
      createdAt: shareLink.created_at,
      expiresAt: shareLink.expires_at,
      status: shareLink.status,
      fontFamily: shareLink.font_family,
      showBranding: shareLink.show_branding,
      showThemeToggle: shareLink.show_theme_toggle,
      showCreatedAt: shareLink.show_created_at,
    },
    shareUrl: `${getAppBaseUrl(request)}/share/${token}`,
  };
}

export async function revokeNoteShare(
  noteId: string,
  userId: string,
  request?: NextRequest
) {
  const note = await assertNoteOwner(noteId);

  if (!note || note.user_id !== userId) {
    return null;
  }

  const revoked = await revokeShareLink(noteId);

  if (!revoked) {
    return null;
  }

  await writeAuditLog({
    actorUserId: userId,
    eventType: AUDIT_EVENTS.SHARE_REVOKED,
    entityType: AUDIT_ENTITIES.SHARE_LINK,
    entityId: revoked.id,
    ipAddress: request ? getClientIp(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    metadata: {
      noteId,
    },
  });

  return revoked;
}

export async function regenerateNoteShare(
  noteId: string,
  userId: string,
  settings?: ShareSettingsInput,
  request?: NextRequest
) {
  const note = await assertNoteOwner(noteId);

  if (!note || note.user_id !== userId || note.status !== "active") {
    return null;
  }

  const previous = await revokeShareLink(noteId);
  const featureAccess = await getFeatureAccess(userId);
  const normalizedSettings = normalizeShareSettings(
    settings,
    featureAccess.entitlement
  );
  const token = generateShareToken();
  const shareLink = await createShareLink({
    noteId,
    userId,
    tokenHash: hashShareToken(token),
    ...normalizedSettings,
  });

  await writeAuditLog({
    actorUserId: userId,
    eventType: AUDIT_EVENTS.SHARE_REGENERATED,
    entityType: AUDIT_ENTITIES.SHARE_LINK,
    entityId: shareLink.id,
    ipAddress: request ? getClientIp(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    metadata: {
      noteId,
      previousShareId: previous?.id ?? null,
    },
  });

  return {
    shareLink: {
      id: shareLink.id,
      accessMode: shareLink.access_mode,
      createdAt: shareLink.created_at,
      expiresAt: shareLink.expires_at,
      status: shareLink.status,
      fontFamily: shareLink.font_family,
      showBranding: shareLink.show_branding,
      showThemeToggle: shareLink.show_theme_toggle,
      showCreatedAt: shareLink.show_created_at,
    },
    shareUrl: `${getAppBaseUrl(request)}/share/${token}`,
  };
}

export async function updateNoteShareSettings(
  noteId: string,
  userId: string,
  settings: ShareSettingsInput,
  request?: NextRequest
) {
  const note = await assertNoteOwner(noteId);

  if (!note || note.user_id !== userId || note.status !== "active") {
    return null;
  }

  const activeShare = await getActiveShareLinkByNoteId(noteId);

  if (!activeShare) {
    return null;
  }

  const featureAccess = await getFeatureAccess(userId);
  const normalizedSettings = normalizeShareSettings(
    settings,
    featureAccess.entitlement
  );
  const shareLink = await updateShareLinkSettings(noteId, normalizedSettings);

  if (!shareLink) {
    return null;
  }

  await writeAuditLog({
    actorUserId: userId,
    eventType: AUDIT_EVENTS.SHARE_UPDATED,
    entityType: AUDIT_ENTITIES.SHARE_LINK,
    entityId: shareLink.id,
    ipAddress: request ? getClientIp(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    metadata: normalizedSettings,
  });

  return {
    id: shareLink.id,
    accessMode: shareLink.access_mode,
    createdAt: shareLink.created_at,
    expiresAt: shareLink.expires_at,
    status: shareLink.status,
    fontFamily: shareLink.font_family,
    showBranding: shareLink.show_branding,
    showThemeToggle: shareLink.show_theme_toggle,
    showCreatedAt: shareLink.show_created_at,
  } satisfies ActiveShareLinkSummary;
}

export async function getPublicSharedNote(token: string) {
  const tokenHash = hashShareToken(token);
  const shareLink = await lookupActiveShareByTokenHash(tokenHash);

  if (!shareLink || shareLink.status !== "active") {
    return null;
  }

  const sharedNote = await getPublicSharedNoteByNoteId(shareLink.note_id);

  if (!sharedNote || sharedNote.note.status !== "active") {
    return null;
  }

  await touchShareLinkAccessed(shareLink.id);

  return {
    note: sharedNote.note,
    ownerTier: sharedNote.ownerTier,
    shareLink,
  };
}
