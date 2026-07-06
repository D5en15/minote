import "server-only";

import { AUDIT_ENTITIES, AUDIT_EVENTS } from "@/server/audit-events";
import { writeAuditLog } from "@/server/audit";
import { createUserNote, listUserNotes } from "@/server/services/notes";
import { attachTagToUserNote } from "@/server/services/tags";
import type { GuestImportInput } from "@/server/schemas";
import type { NextRequest } from "next/server";

type RenamedGuestNote = {
  localId: string;
  originalTitle: string;
  finalTitle: string;
  contentMarkdown: string;
  tags: string[];
};

function normalizeTitleForCollision(title: string) {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}

function buildImportedTitle(baseTitle: string, sequence: number) {
  return sequence === 1
    ? `${baseTitle} (Imported from guest)`
    : `${baseTitle} (Imported from guest ${sequence})`;
}

export async function previewGuestImportForUser(
  userId: string,
  input: GuestImportInput
) {
  const existingNotes = await listUserNotes({});
  const usedTitles = new Set(
    existingNotes.map((note) => normalizeTitleForCollision(note.title))
  );

  const renamedNotes: Array<{
    localId: string;
    originalTitle: string;
    finalTitle: string;
  }> = [];
  const preparedNotes: RenamedGuestNote[] = [];

  for (const note of input.notes) {
    const originalTitle = note.title.trim();
    let finalTitle = originalTitle;
    let sequence = 0;

    while (usedTitles.has(normalizeTitleForCollision(finalTitle))) {
      sequence += 1;
      finalTitle = buildImportedTitle(originalTitle, sequence);
    }

    usedTitles.add(normalizeTitleForCollision(finalTitle));

    if (finalTitle !== originalTitle) {
      renamedNotes.push({
        localId: note.localId,
        originalTitle,
        finalTitle,
      });
    }

    preparedNotes.push({
      localId: note.localId,
      originalTitle,
      finalTitle,
      contentMarkdown: note.contentMarkdown,
      tags: note.tags,
    });
  }

  return {
    importCount: preparedNotes.length,
    preparedNotes,
    renamedNotes,
  };
}

export async function importGuestNotesForUser(
  userId: string,
  input: GuestImportInput,
  request?: NextRequest
) {
  const preview = await previewGuestImportForUser(userId, input);

  for (const note of preview.preparedNotes) {
    const created = await createUserNote(
      userId,
      {
        title: note.finalTitle,
        contentMarkdown: note.contentMarkdown,
      },
      request
    );

    for (const tagName of note.tags) {
      await attachTagToUserNote(created.id, userId, tagName, request);
    }
  }

  await writeAuditLog({
    actorUserId: userId,
    eventType: AUDIT_EVENTS.GUEST_IMPORT_COMPLETED,
    entityType: AUDIT_ENTITIES.USER,
    entityId: userId,
    metadata: {
      importedCount: preview.importCount,
      renamedCount: preview.renamedNotes.length,
    },
  });

  return {
    importedCount: preview.importCount,
    renamedNotes: preview.renamedNotes,
  };
}
