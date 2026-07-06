import { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/server/api-response";
import { AUDIT_ENTITIES, AUDIT_EVENTS } from "@/server/audit-events";
import { writeAuditLog } from "@/server/audit";
import { getClientIp, getUserAgent } from "@/server/request";
import { createServerSupabaseClient } from "@/server/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return errorResponse("INTERNAL_ERROR", "Unable to sign out");
  }

  await writeAuditLog({
    actorUserId: user?.id ?? null,
    eventType: AUDIT_EVENTS.AUTH_LOGOUT,
    entityType: AUDIT_ENTITIES.AUTH,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });

  return successResponse({ signedOut: true });
}
