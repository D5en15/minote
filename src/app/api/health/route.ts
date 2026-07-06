import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/server/api-response";
import { createServiceRoleClient } from "@/server/supabase/service-role";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    
    // Check Supabase connection by running a simple query
    const { data, error } = await supabase
      .from("plans")
      .select("id")
      .limit(1);

    if (error) {
      throw error;
    }

    return successResponse({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
      },
    });
  } catch (error) {
    console.error("Health check failure:", error);
    return errorResponse("INTERNAL_ERROR", "System health check failed");
  }
}
