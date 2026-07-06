import { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/server/api-response";
import { requireAdminRole } from "@/server/auth";
import { createServiceRoleClient } from "@/server/supabase/service-role";

export async function GET(request: NextRequest) {
  try {
    // 1. Authorization check: must have admin role
    await requireAdminRole();
  } catch {
    return errorResponse("UNAUTHORIZED", "Admin authorization required");
  }

  const { searchParams } = new URL(request.url);
  const eventType = searchParams.get("eventType");
  const userId = searchParams.get("userId");
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 25)));
  const offset = (page - 1) * limit;

  try {
    const supabase = createServiceRoleClient();

    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" });

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    if (userId) {
      query = query.eq("actor_user_id", userId);
    }

    // Apply pagination and descending ordering by created_at
    const { data: logs, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return successResponse({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Admin Audit Logs Fetch Error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve audit log history");
  }
}
