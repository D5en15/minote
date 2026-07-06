import { NextRequest } from "next/server";
import { z } from "zod";

import { errorResponse, successResponse } from "@/server/api-response";
import { requireUser } from "@/server/auth";
import { noteIdParamSchema, noteUpdateSchema } from "@/server/schemas";
import {
  assertNoteOwner,
  deleteUserNote,
  updateUserNote,
} from "@/server/services/notes";

type NoteRouteContext = {
  params: Promise<{
    noteId: string;
  }>;
};

async function parseParams(context: NoteRouteContext) {
  const params = await context.params;
  return noteIdParamSchema.safeParse(params);
}

export async function GET(_request: NextRequest, context: NoteRouteContext) {
  let user;

  try {
    user = await requireUser();
  } catch {
    return errorResponse("UNAUTHORIZED", "Authentication required");
  }

  const params = await parseParams(context);

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

    return successResponse({ note });
  } catch {
    return errorResponse("INTERNAL_ERROR", "Unable to load note");
  }
}

export async function PATCH(request: NextRequest, context: NoteRouteContext) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Invalid JSON body");
  }

  const payload = noteUpdateSchema.safeParse(body);

  if (!payload.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid note payload", {
      details: z.flattenError(payload.error).fieldErrors,
    });
  }

  let user;

  try {
    user = await requireUser();
  } catch {
    return errorResponse("UNAUTHORIZED", "Authentication required");
  }

  const params = await parseParams(context);

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

    const result = await updateUserNote(
      params.data.noteId,
      payload.data,
      user.id,
      request
    );

    if (!result) {
      return errorResponse("NOT_FOUND", "Note not found");
    }

    if (result.conflict) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "REVISION_CONFLICT",
            message: "Note revision conflict",
          },
          serverRevision: result.serverNote.revision,
          serverNote: {
            title: result.serverNote.title,
            contentMarkdown: result.serverNote.content_markdown,
          },
        },
        { status: 409 }
      );
    }

    return successResponse({ note: result.note });
  } catch (error) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    // Log error to observability pipeline (17.4)
    const { logError } = await import("@/server/logger");
    await logError({
      message: errObj.message,
      severity: "error",
      context: "autosave_failed",
      userId: user.id,
      errorStack: errObj.stack,
    });
    return errorResponse("INTERNAL_ERROR", "Unable to update note");
  }
}

export async function DELETE(request: NextRequest, context: NoteRouteContext) {
  let user;

  try {
    user = await requireUser();
  } catch {
    return errorResponse("UNAUTHORIZED", "Authentication required");
  }

  const params = await parseParams(context);

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

    const note = await deleteUserNote(params.data.noteId, user.id, request);

    if (!note) {
      return errorResponse("NOT_FOUND", "Note not found");
    }

    return successResponse({ note });
  } catch {
    return errorResponse("INTERNAL_ERROR", "Unable to delete note");
  }
}
