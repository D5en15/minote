import { NextRequest } from "next/server";
import { z } from "zod";

import { errorResponse, successResponse } from "@/server/api-response";
import { requireUser } from "@/server/auth";
import { noteIdParamSchema } from "@/server/schemas";
import { regenerateNoteShare } from "@/server/services/shares";

type ShareRegenerateRouteContext = {
  params: Promise<{
    noteId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: ShareRegenerateRouteContext
) {
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
    const share = await regenerateNoteShare(params.data.noteId, user.id, request);

    if (!share) {
      return errorResponse("NOT_FOUND", "Note not found");
    }

    return successResponse(share);
  } catch {
    return errorResponse("INTERNAL_ERROR", "Unable to regenerate share link");
  }
}
