import { NextRequest } from "next/server";
import { z } from "zod";

import { errorResponse, successResponse } from "@/server/api-response";
import { QuotaExceededError } from "@/server/errors";
import { requireUser } from "@/server/auth";
import { noteIdParamSchema, tagInputSchema } from "@/server/schemas";
import { attachTagToUserNote } from "@/server/services/tags";

type NoteTagsRouteContext = {
  params: Promise<{
    noteId: string;
  }>;
};

async function parseParams(context: NoteTagsRouteContext) {
  const params = await context.params;
  return noteIdParamSchema.safeParse(params);
}

export async function POST(request: NextRequest, context: NoteTagsRouteContext) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Invalid JSON body");
  }

  const payload = tagInputSchema.safeParse(body);

  if (!payload.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid tag payload", {
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
    const note = await attachTagToUserNote(
      params.data.noteId,
      user.id,
      payload.data.name,
      request
    );

    if (!note) {
      return errorResponse("NOT_FOUND", "Note not found");
    }

    return successResponse({ note });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return errorResponse("FORBIDDEN", "QUOTA_EXCEEDED", {
        details: error.details,
      });
    }

    return errorResponse("INTERNAL_ERROR", "Unable to attach tag");
  }
}
