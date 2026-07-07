import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import { AUDIT_ENTITIES, AUDIT_EVENTS } from "@/server/audit-events";
import { writeAuditLog } from "@/server/audit";
import {
  createNote,
  getNoteById,
  listExpiredTrashedNoteIds,
  listNotesForUser,
  moveNoteToTrash,
  permanentlyDeleteNote,
  permanentlyDeleteNoteForSystem,
  restoreNote,
  revokeShareLinksForNote,
  updateNote,
  type ListNotesFilters,
} from "@/server/repositories/notes";
import { getQuotaEntitlement } from "@/server/quota";
import { QuotaExceededError } from "@/server/errors";
import { getClientIp, getUserAgent } from "@/server/request";
import { createServiceRoleClient } from "@/server/supabase/service-role";
import type { NoteStatus, NoteWithTags } from "@/types/database";
import type { NextRequest } from "next/server";

type RevisionConflictResult = {
  conflict: true;
  serverNote: NoteWithTags;
};

type NoteMutationResult = {
  conflict: false;
  note: NoteWithTags;
};

export type UpdateNoteResult = RevisionConflictResult | NoteMutationResult;

function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isNotFoundError(error: PostgrestError | null) {
  return error?.code === "PGRST116";
}

export async function assertNoteOwner(noteId: string) {
  const note = await getNoteById(noteId);

  if (!note) {
    return null;
  }

  return note;
}

export async function getUserNoteById(noteId: string) {
  return getNoteById(noteId);
}

export async function incrementNotesCreatedCount(userId: string) {
  const supabase = createServiceRoleClient();
  const dateKey = new Date().toISOString().slice(0, 10);
  const { data: existing, error: existingError } = await supabase
    .from("usage_counters")
    .select("*")
    .eq("user_id", userId)
    .eq("date_key", dateKey)
    .maybeSingle();

  if (existingError && !isNotFoundError(existingError)) {
    throw existingError;
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("usage_counters")
      .update({
        notes_created_count: existing.notes_created_count + 1,
      })
      .eq("id", existing.id);

    if (updateError) {
      throw updateError;
    }

    return;
  }

  const { error: insertError } = await supabase.from("usage_counters").insert({
    user_id: userId,
    date_key: dateKey,
    notes_created_count: 1,
  });

  if (insertError) {
    throw insertError;
  }
}

export async function assertCanCreateNote(userId: string) {
  const entitlement = await getQuotaEntitlement(userId);
  const supabase = createServiceRoleClient();
  const today = new Date().toISOString().slice(0, 10);
  const [{ count: noteCount, error: noteCountError }, { data: usage, error: usageError }] =
    await Promise.all([
      supabase
        .from("notes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("status", ["active", "trashed"]),
      supabase
        .from("usage_counters")
        .select("notes_created_count")
        .eq("user_id", userId)
        .eq("date_key", today)
        .maybeSingle(),
    ]);

  if (noteCountError) {
    throw noteCountError;
  }

  if (usageError && !isNotFoundError(usageError)) {
    throw usageError;
  }

  const activeAndTrashedCount = noteCount ?? 0;
  const notesCreatedToday = usage?.notes_created_count ?? 0;

  if (activeAndTrashedCount >= entitlement.noteLimit) {
    throw new QuotaExceededError({
      limitType: "total_notes",
      tier: entitlement.tier,
      noteLimit: entitlement.noteLimit,
      currentCount: activeAndTrashedCount,
    });
  }

  if (notesCreatedToday >= entitlement.dailyCreateLimit) {
    throw new QuotaExceededError({
      limitType: "daily_notes",
      tier: entitlement.tier,
      dailyCreateLimit: entitlement.dailyCreateLimit,
      currentCount: notesCreatedToday,
    });
  }
}

export async function listUserNotes(filters: ListNotesFilters = {}) {
  return listNotesForUser(filters);
}

export async function createUserNote(
  userId: string,
  input: {
    title: string;
    contentMarkdown: string;
  },
  request?: NextRequest
) {
  await assertCanCreateNote(userId);

  const note = await createNote({
    userId,
    title: input.title,
    contentMarkdown: input.contentMarkdown,
    contentText: toPlainText(input.contentMarkdown),
  });

  await incrementNotesCreatedCount(userId);

  await writeAuditLog({
    actorUserId: userId,
    eventType: AUDIT_EVENTS.NOTE_CREATED,
    entityType: AUDIT_ENTITIES.NOTE,
    entityId: note.id,
    ipAddress: request ? getClientIp(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    metadata: {
      revision: note.revision,
      status: note.status,
    },
  });

  return note;
}

export async function updateUserNote(
  noteId: string,
  input: {
    title?: string;
    contentMarkdown?: string;
    baseRevision: number;
  },
  userId: string,
  request?: NextRequest
): Promise<UpdateNoteResult | null> {
  const existing = await getNoteById(noteId);

  if (!existing) {
    return null;
  }

  const nextMarkdown = input.contentMarkdown ?? existing.content_markdown;
  const note = await updateNote({
    noteId,
    title: input.title,
    contentMarkdown: input.contentMarkdown,
    contentText:
      input.contentMarkdown !== undefined ? toPlainText(nextMarkdown) : undefined,
    baseRevision: input.baseRevision,
  });

  if (!note) {
    const serverNote = await getNoteById(noteId);

    if (!serverNote) {
      return null;
    }

    return {
      conflict: true,
      serverNote,
    };
  }

  await writeAuditLog({
    actorUserId: userId,
    eventType: AUDIT_EVENTS.NOTE_UPDATED,
    entityType: AUDIT_ENTITIES.NOTE,
    entityId: note.id,
    ipAddress: request ? getClientIp(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    metadata: {
      revision: note.revision,
    },
  });

  return {
    conflict: false,
    note,
  };
}

export async function deleteUserNote(
  noteId: string,
  userId: string,
  request?: NextRequest
) {
  const note = await moveNoteToTrash(noteId);

  if (!note) {
    return null;
  }

  await revokeShareLinksForNote(noteId);
  await writeAuditLog({
    actorUserId: userId,
    eventType: AUDIT_EVENTS.NOTE_DELETED,
    entityType: AUDIT_ENTITIES.NOTE,
    entityId: note.id,
    ipAddress: request ? getClientIp(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    metadata: {
      status: note.status,
      deleteAfter: note.delete_after,
    },
  });

  return note;
}

export async function restoreUserNote(
  noteId: string,
  userId: string,
  request?: NextRequest
) {
  const note = await restoreNote(noteId);

  if (!note) {
    return null;
  }

  await writeAuditLog({
    actorUserId: userId,
    eventType: AUDIT_EVENTS.NOTE_RESTORED,
    entityType: AUDIT_ENTITIES.NOTE,
    entityId: note.id,
    ipAddress: request ? getClientIp(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    metadata: {
      status: note.status,
    },
  });

  return note;
}

export async function permanentlyDeleteUserNote(
  noteId: string,
  userId: string,
  request?: NextRequest
) {
  const note = await permanentlyDeleteNote(noteId);

  if (!note) {
    return null;
  }

  await writeAuditLog({
    actorUserId: userId,
    eventType: AUDIT_EVENTS.NOTE_DELETED,
    entityType: AUDIT_ENTITIES.NOTE,
    entityId: note.id,
    ipAddress: request ? getClientIp(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    metadata: {
      status: "deleted" satisfies NoteStatus | "deleted",
      permanent: true,
    },
  });

  return note;
}

export async function purgeExpiredTrashedNotes() {
  const expiredNoteIds = await listExpiredTrashedNoteIds();
  let purgedCount = 0;

  for (const noteId of expiredNoteIds) {
    const note = await permanentlyDeleteNoteForSystem(noteId);

    if (!note) {
      continue;
    }

    purgedCount += 1;

    await writeAuditLog({
      eventType: AUDIT_EVENTS.NOTE_DELETED,
      entityType: AUDIT_ENTITIES.NOTE,
      entityId: note.id,
      metadata: {
        status: "deleted" satisfies NoteStatus | "deleted",
        permanent: true,
        source: "purge-trashed-notes",
      },
    });
  }

  return {
    purgedCount,
  };
}
