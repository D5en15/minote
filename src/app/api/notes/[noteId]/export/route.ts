import { NextRequest } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/server/api-response";
import { requireUser } from "@/server/auth";
import { noteIdParamSchema } from "@/server/schemas";
import { assertNoteOwner } from "@/server/services/notes";
import { exportNoteToMarkdown } from "@/server/services/export";
import { writeAuditLog } from "@/server/audit";
import { AUDIT_ENTITIES, AUDIT_EVENTS } from "@/server/audit-events";
import { getClientIp, getUserAgent } from "@/server/request";

type ExportRouteContext = {
  params: Promise<{
    noteId: string;
  }>;
};

export async function GET(request: NextRequest, context: ExportRouteContext) {
  let user;

  try {
    user = await requireUser();
  } catch {
    return errorResponse("UNAUTHORIZED", "Authentication required");
  }

  const params = noteIdParamSchema.safeParse(await context.params);

  if (!params.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid note id", {
      details: z.flattenError(params.error).fieldErrors,
    });
  }

  try {
    const note = await assertNoteOwner(params.data.noteId);

    if (!note || note.user_id !== user.id) {
      return errorResponse("NOT_FOUND", "Note not found");
    }

    if (note.status !== "active") {
      return errorResponse("BAD_REQUEST", "Cannot export inactive notes");
    }

    const { filename, content } = exportNoteToMarkdown(note);

    await writeAuditLog({
      actorUserId: user.id,
      eventType: AUDIT_EVENTS.NOTE_EXPORTED || "note.exported",
      entityType: AUDIT_ENTITIES.NOTE,
      entityId: note.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      metadata: {
        filename,
        format: "markdown",
      },
    });

    // Content-Disposition forces file download with the safe filename.
    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch {
    return errorResponse("INTERNAL_ERROR", "Unable to export note");
  }
}
