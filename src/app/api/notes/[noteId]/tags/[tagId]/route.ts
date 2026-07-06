import { NextRequest } from "next/server";
import { z } from "zod";

import { errorResponse, successResponse } from "@/server/api-response";
import { requireUser } from "@/server/auth";
import { noteIdParamSchema, tagIdParamSchema } from "@/server/schemas";
import { detachTagFromUserNote } from "@/server/services/tags";

type NoteTagRouteContext = {
  params: Promise<{
    noteId: string;
    tagId: string;
  }>;
};

async function parseParams(context: NoteTagRouteContext) {
  const params = await context.params;
  return z
    .object({
      noteId: noteIdParamSchema.shape.noteId,
      tagId: tagIdParamSchema.shape.tagId,
    })
    .safeParse(params);
}

export async function DELETE(
  request: NextRequest,
  context: NoteTagRouteContext
) {
  let user;

  try {
    user = await requireUser();
  } catch {
    return errorResponse("UNAUTHORIZED", "Authentication required");
  }

  const params = await parseParams(context);

  if (!params.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid tag path", {
      details: z.flattenError(params.error).fieldErrors,
    });
  }

  try {
    const note = await detachTagFromUserNote(
      params.data.noteId,
      params.data.tagId,
      user.id,
      request
    );

    if (!note) {
      return errorResponse("NOT_FOUND", "Note not found");
    }

    return successResponse({ note });
  } catch {
    return errorResponse("INTERNAL_ERROR", "Unable to detach tag");
  }
}
