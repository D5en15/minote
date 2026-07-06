import { NextRequest } from "next/server";
import { z } from "zod";

import { errorResponse, successResponse } from "@/server/api-response";
import { requireUser } from "@/server/auth";
import { noteIdParamSchema } from "@/server/schemas";
import { assertNoteOwner, restoreUserNote } from "@/server/services/notes";

type RestoreRouteContext = {
  params: Promise<{
    noteId: string;
  }>;
};

export async function POST(request: NextRequest, context: RestoreRouteContext) {
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
    const existing = await assertNoteOwner(params.data.noteId);

    if (!existing || existing.user_id !== user.id) {
      return errorResponse("NOT_FOUND", "Note not found");
    }

    const note = await restoreUserNote(params.data.noteId, user.id, request);

    if (!note) {
      return errorResponse("NOT_FOUND", "Note not found");
    }

    return successResponse({ note });
  } catch {
    return errorResponse("INTERNAL_ERROR", "Unable to restore note");
  }
}
