import "server-only";

import { AUDIT_ENTITIES, AUDIT_EVENTS } from "@/server/audit-events";
import { writeAuditLog } from "@/server/audit";
import { assertNoteOwner, getUserNoteById } from "@/server/services/notes";
import {
  attachTagToNote,
  cleanupUnusedTag,
  detachTagFromNote,
  findOrCreateTag,
  getTagById,
  listTagIdsForNote,
  listTagsForUser,
} from "@/server/repositories/tags";
import { MAX_TAGS_PER_NOTE } from "@/server/tags";
import { getClientIp, getUserAgent } from "@/server/request";
import type { NextRequest } from "next/server";

export async function listUserTags() {
  return listTagsForUser();
}

export async function attachTagToUserNote(
  noteId: string,
  userId: string,
  tagName: string,
  request?: NextRequest
) {
  const note = await assertNoteOwner(noteId);

  if (!note || note.user_id !== userId) {
    return null;
  }

  const existingTagIds = await listTagIdsForNote(noteId);
  const tag = await findOrCreateTag(userId, tagName);

  if (!existingTagIds.includes(tag.id) && existingTagIds.length >= MAX_TAGS_PER_NOTE) {
    throw new Error("TAG_LIMIT_REACHED");
  }

  await attachTagToNote(noteId, tag.id);

  const updatedNote = await getUserNoteById(noteId);

  if (!updatedNote) {
    return null;
  }

  await writeAuditLog({
    actorUserId: userId,
    eventType: AUDIT_EVENTS.NOTE_UPDATED,
    entityType: AUDIT_ENTITIES.NOTE,
    entityId: noteId,
    ipAddress: request ? getClientIp(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    metadata: {
      tagId: tag.id,
      tagName: tag.name,
      action: "tag_attached",
    },
  });

  return updatedNote;
}

export async function detachTagFromUserNote(
  noteId: string,
  tagId: string,
  userId: string,
  request?: NextRequest
) {
  const note = await assertNoteOwner(noteId);

  if (!note || note.user_id !== userId) {
    return null;
  }

  const tag = await getTagById(tagId);

  if (!tag) {
    return null;
  }

  await detachTagFromNote(noteId, tagId);
  await cleanupUnusedTag(tagId);

  const updatedNote = await getUserNoteById(noteId);

  if (!updatedNote) {
    return null;
  }

  await writeAuditLog({
    actorUserId: userId,
    eventType: AUDIT_EVENTS.NOTE_UPDATED,
    entityType: AUDIT_ENTITIES.NOTE,
    entityId: noteId,
    ipAddress: request ? getClientIp(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    metadata: {
      tagId,
      tagName: tag.name,
      action: "tag_detached",
    },
  });

  return updatedNote;
}
