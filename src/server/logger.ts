import { createServiceRoleClient } from "@/server/supabase/service-role";

// Simple custom error tracker / mock logger for Observability & production readiness (17.1 - 17.3)
export type LogSeverity = "info" | "warn" | "error" | "fatal";

export type ErrorEventInput = {
  message: string;
  severity: LogSeverity;
  context?: string;
  userId?: string | null;
  errorStack?: string;
  metadata?: Record<string, any>;
};

export async function logError(input: ErrorEventInput) {
  // Output details to console for logging agents (e.g. Sentry/Vercel Logs integration)
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [SEVERITY: ${input.severity.toUpperCase()}] [CONTEXT: ${input.context || "global"}] MESSAGE: ${input.message}`, {
    userId: input.userId,
    errorStack: input.errorStack,
    metadata: input.metadata,
  });

  try {
    const supabase = createServiceRoleClient();
    
    // Write details into standard audit logs table with high-priority status mapping
    // This allows administrators to filter errors from admin console
    await supabase.from("audit_logs").insert({
      actor_user_id: input.userId ?? null,
      event_type: `error.${input.context || "general"}.${input.severity}`,
      entity_type: "system",
      entity_id: null,
      metadata: {
        message: input.message,
        severity: input.severity,
        errorStack: input.errorStack || null,
        ...input.metadata,
      },
    });
  } catch (dbErr) {
    console.error("Failed to write observability error log event to database:", dbErr);
  }
}
