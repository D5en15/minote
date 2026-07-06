import { errorResponse, successResponse } from "@/server/api-response";
import { purgeExpiredTrashedNotes } from "@/server/services/notes";

function getExpectedJobSecret() {
  return process.env.MINOTE_JOB_SECRET ?? "minote-job-secret";
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const expected = `Bearer ${getExpectedJobSecret()}`;

  if (authorization !== expected) {
    return errorResponse("FORBIDDEN", "Invalid job secret");
  }

  try {
    const result = await purgeExpiredTrashedNotes();
    return successResponse(result);
  } catch {
    return errorResponse("INTERNAL_ERROR", "Unable to purge trashed notes");
  }
}
