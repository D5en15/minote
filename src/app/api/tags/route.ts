import { errorResponse, successResponse } from "@/server/api-response";
import { requireUser } from "@/server/auth";
import { listUserTags } from "@/server/services/tags";

export async function GET() {
  try {
    await requireUser();
  } catch {
    return errorResponse("UNAUTHORIZED", "Authentication required");
  }

  try {
    const tags = await listUserTags();
    return successResponse({ tags });
  } catch {
    return errorResponse("INTERNAL_ERROR", "Unable to load tags");
  }
}
