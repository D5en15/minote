import { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/server/api-response";
import { requireUser } from "@/server/auth";
import { createServiceRoleClient } from "@/server/supabase/service-role";

export async function GET(request: NextRequest) {
  let user;

  try {
    user = await requireUser();
  } catch {
    return errorResponse("UNAUTHORIZED", "Authentication required");
  }

  try {
    const supabase = createServiceRoleClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!profile) {
      return errorResponse("NOT_FOUND", "User profile not found");
    }

    return successResponse(profile);
  } catch (error) {
    console.error("Fetch profile error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve user profile");
  }
}
