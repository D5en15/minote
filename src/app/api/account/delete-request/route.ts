import { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/server/api-response";
import { requireUser } from "@/server/auth";
import { createServiceRoleClient } from "@/server/supabase/service-role";
import { writeAuditLog } from "@/server/audit";
import { AUDIT_ENTITIES, AUDIT_EVENTS } from "@/server/audit-events";

export async function POST(request: NextRequest) {
  let user;

  try {
    user = await requireUser();
  } catch {
    return errorResponse("UNAUTHORIZED", "Authentication required");
  }

  try {
    const supabase = createServiceRoleClient();

    // 1. Mark profile as deleted
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      throw profileError;
    }

    // 2. Revoke all active shared links owned by the user
    const { error: shareError } = await supabase
      .from("share_links")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("status", "active");

    if (shareError) {
      throw shareError;
    }

    // 3. Register Deletion Request in Audit Logs
    await writeAuditLog({
      actorUserId: user.id,
      eventType: AUDIT_EVENTS.ACCOUNT_DELETION_REQUESTED,
      entityType: AUDIT_ENTITIES.USER,
      entityId: user.id,
      metadata: {
        requestedAt: new Date().toISOString(),
      },
    });

    return successResponse({ requested: true });
  } catch (error) {
    console.error("Account Deletion Error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to register account deletion request");
  }
}
