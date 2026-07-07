import { NextRequest } from "next/server";
import { z } from "zod";

import { errorResponse, successResponse } from "@/server/api-response";
import { requireUser } from "@/server/auth";
import { noteIdParamSchema } from "@/server/schemas";
import {
  createNoteShare,
  revokeNoteShare,
  updateNoteShareSettings,
} from "@/server/services/shares";

type ShareRouteContext = {
  params: Promise<{
    noteId: string;
  }>;
};

const shareSettingsSchema = z.object({
  fontFamily: z.enum(["poppins", "lora"]).optional(),
  showBranding: z.boolean().optional(),
  showThemeToggle: z.boolean().optional(),
  showCreatedAt: z.boolean().optional(),
});

async function parseParams(context: ShareRouteContext) {
  return noteIdParamSchema.safeParse(await context.params);
}

export async function POST(request: NextRequest, context: ShareRouteContext) {
  let body: unknown = {};

  try {
    body = await request.json();
  } catch {}

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

  const settings = shareSettingsSchema.safeParse(body);

  if (!settings.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid share settings", {
      details: z.flattenError(settings.error).fieldErrors,
    });
  }

  try {
    const share = await createNoteShare(
      params.data.noteId,
      user.id,
      settings.data,
      request
    );

    if (!share) {
      return errorResponse("NOT_FOUND", "Note not found");
    }

    return successResponse(share, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "SHARE_ALREADY_ACTIVE") {
      return errorResponse("FORBIDDEN", "Share link already active");
    }

    return errorResponse("INTERNAL_ERROR", "Unable to create share link");
  }
}

export async function PATCH(request: NextRequest, context: ShareRouteContext) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Invalid JSON body");
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

  const settings = shareSettingsSchema.safeParse(body);

  if (!settings.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid share settings", {
      details: z.flattenError(settings.error).fieldErrors,
    });
  }

  try {
    const shareLink = await updateNoteShareSettings(
      params.data.noteId,
      user.id,
      settings.data,
      request
    );

    if (!shareLink) {
      return errorResponse("NOT_FOUND", "Share link not found");
    }

    return successResponse({ shareLink });
  } catch {
    return errorResponse("INTERNAL_ERROR", "Unable to update share settings");
  }
}

export async function DELETE(request: NextRequest, context: ShareRouteContext) {
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
    const revoked = await revokeNoteShare(params.data.noteId, user.id, request);

    if (!revoked) {
      return errorResponse("NOT_FOUND", "Share link not found");
    }

    return successResponse({ revoked: true });
  } catch {
    return errorResponse("INTERNAL_ERROR", "Unable to revoke share link");
  }
}
