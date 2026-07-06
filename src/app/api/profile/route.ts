import { NextRequest } from "next/server";
import { z } from "zod";

import { errorResponse, successResponse } from "@/server/api-response";
import { requireUser } from "@/server/auth";
import { updateProfileSchema } from "@/server/schemas/profile";
import { createServiceRoleClient } from "@/server/supabase/service-role";
import { writeAuditLog } from "@/server/audit";
import { AUDIT_ENTITIES, AUDIT_EVENTS } from "@/server/audit-events";

export async function PATCH(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Invalid JSON body");
  }

  const payload = updateProfileSchema.safeParse(body);

  if (!payload.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid input parameters", {
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
    const supabase = createServiceRoleClient();

    // Fetch existing profile metadata to log changes accurately
    const { data: oldProfile, error: profileError } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: payload.data.displayName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    // Write audit log
    await writeAuditLog({
      actorUserId: user.id,
      eventType: AUDIT_EVENTS.PROFILE_UPDATED,
      entityType: AUDIT_ENTITIES.USER,
      entityId: user.id,
      metadata: {
        oldDisplayName: oldProfile.display_name,
        newDisplayName: updatedProfile.display_name,
      },
    });

    return successResponse({ profile: updatedProfile });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to update profile settings");
  }
}
