import { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/server/api-response";
import { requireAdminRole } from "@/server/auth";
import { createServiceRoleClient } from "@/server/supabase/service-role";

type RouteParams = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Authorization check: must have admin role
    await requireAdminRole();
  } catch {
    return errorResponse("UNAUTHORIZED", "Admin authorization required");
  }

  const { userId } = await params;

  try {
    const supabase = createServiceRoleClient();

    // Fetch user details, excluding any sensitive notes content
    const { data: userProfile, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, role, created_at, updated_at, deleted_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!userProfile) {
      return errorResponse("NOT_FOUND", "Requested user profile not found");
    }

    return successResponse(userProfile);
  } catch (error) {
    console.error("Admin Fetch User Profile Error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve user profile");
  }
}
