import { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/server/api-response";
import { requireUser } from "@/server/auth";
import { getBillingStatus } from "@/server/services/billing";

export async function GET(request: NextRequest) {
  let user;

  try {
    user = await requireUser();
  } catch {
    return errorResponse("UNAUTHORIZED", "Authentication required");
  }

  try {
    const status = await getBillingStatus(user.id);
    return successResponse(status);
  } catch {
    return errorResponse("INTERNAL_ERROR", "Unable to load billing status");
  }
}
