import { z } from "zod";

import { errorResponse, successResponse } from "@/server/api-response";
import { requireUser } from "@/server/auth";
import { guestImportSchema } from "@/server/schemas";
import { previewGuestImportForUser } from "@/server/services/guest-import";

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
    const preview = await previewGuestImportForUser(user.id, payload.data);

    return successResponse({
      importCount: preview.importCount,
      renamedNotes: preview.renamedNotes,
    });
  } catch {
    return errorResponse("INTERNAL_ERROR", "Unable to preview guest import");
  }
}
