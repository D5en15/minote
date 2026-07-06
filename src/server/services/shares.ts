import "server-only";

import { AUDIT_ENTITIES, AUDIT_EVENTS } from "@/server/audit-events";
import { writeAuditLog } from "@/server/audit";
import { getAppBaseUrl, getClientIp, getUserAgent } from "@/server/request";
import { assertNoteOwner } from "@/server/services/notes";
import {
  createShareLink,
  getActiveShareLinkByNoteId,
  getPublicSharedNoteByNoteId,
  lookupActiveShareByTokenHash,
  revokeShareLink,
  touchShareLinkAccessed,
  type ActiveShareLinkSummary,
} from "@/server/repositories/shares";
import { hashShareToken } from "@/server/security/hash";
import { generateShareToken } from "@/server/security/token";
import type { NextRequest } from "next/server";

export type ShareMutationResult = {
  shareLink: ActiveShareLinkSummary;
  shareUrl: string;
};

export async function createNoteShare(
  noteId: string,
  userId: string,
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

  const token = generateShareToken();
  const shareLink = await createShareLink({
    noteId,
    userId,
    tokenHash: hashShareToken(token),
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
  request?: NextRequest
) {
  const note = await assertNoteOwner(noteId);

  if (!note || note.user_id !== userId || note.status !== "active") {
    return null;
  }

  const previous = await revokeShareLink(noteId);
  const token = generateShareToken();
  const shareLink = await createShareLink({
    noteId,
    userId,
    tokenHash: hashShareToken(token),
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
    },
    shareUrl: `${getAppBaseUrl(request)}/share/${token}`,
  };
}

export async function getPublicSharedNote(token: string) {
  const tokenHash = hashShareToken(token);
  const shareLink = await lookupActiveShareByTokenHash(tokenHash);

  if (!shareLink || shareLink.status !== "active") {
    return null;
  }

  const note = await getPublicSharedNoteByNoteId(shareLink.note_id);

  if (!note || note.status !== "active") {
    return null;
  }

  await touchShareLinkAccessed(shareLink.id);

  return {
    note,
    shareLink,
  };
}
