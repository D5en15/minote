import { z } from "zod";

import { errorResponse, successResponse } from "@/server/api-response";
import { requireUser } from "@/server/auth";
import { guestImportSchema } from "@/server/schemas";
import { importGuestNotesForUser } from "@/server/services/guest-import";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Invalid JSON body");
  }

  const payload = guestImportSchema.safeParse(body);

  if (!payload.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid guest import payload", {
      details: z.flattenError(payload.error).fieldErrors,
    });
  }

  let user;

  try {
    user = await requireUser();
  } catch {
    return errorResponse("UNAUTHORIZED", "Authentication required");
  }

  try {
    const result = await importGuestNotesForUser(user.id, payload.data);
    return successResponse(result);
  } catch (error) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    // Log error to observability pipeline (17.5)
    const { logError } = await import("@/server/logger");
    await logError({
      message: errObj.message,
      severity: "error",
      context: "guest_import",
      userId: user.id,
      errorStack: errObj.stack,
    });
    return errorResponse("INTERNAL_ERROR", "Unable to import guest notes");
  }
}
