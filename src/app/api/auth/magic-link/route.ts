import { NextRequest } from "next/server";
import { z } from "zod";

import { errorResponse, successResponse } from "@/server/api-response";
import { AUDIT_ENTITIES, AUDIT_EVENTS } from "@/server/audit-events";
import { writeAuditLog } from "@/server/audit";
import { developmentRateLimiter } from "@/server/rate-limit";
import { getAppBaseUrl, getClientIp, getUserAgent } from "@/server/request";
import { magicLinkRequestSchema } from "@/server/schemas/auth";
import { createServerSupabaseClient } from "@/server/supabase/server";

const IP_LIMIT = 20;
const EMAIL_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Invalid JSON body");
  }

  const parsed = magicLinkRequestSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid email address", {
      details: z.flattenError(parsed.error).fieldErrors,
    });
  }

  const ipAddress = getClientIp(request);
  const userAgent = getUserAgent(request);
  const ipKey = `auth:magic-link:ip:${ipAddress ?? "unknown"}`;
  const emailKey = `auth:magic-link:email:${parsed.data.email}`;
  const [ipLimit, emailLimit] = await Promise.all([
    developmentRateLimiter.check({
      key: ipKey,
      limit: IP_LIMIT,
      windowMs: WINDOW_MS,
    }),
    developmentRateLimiter.check({
      key: emailKey,
      limit: EMAIL_LIMIT,
      windowMs: WINDOW_MS,
    }),
  ]);

  if (!ipLimit.allowed || !emailLimit.allowed) {
    return errorResponse("RATE_LIMITED", "Too many sign-in requests", {
      headers: {
        "Retry-After": Math.ceil(
          (Math.min(ipLimit.resetAt.getTime(), emailLimit.resetAt.getTime()) -
            Date.now()) /
            1000
        ).toString(),
      },
    });
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${getAppBaseUrl(request)}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  await writeAuditLog({
    eventType: AUDIT_EVENTS.AUTH_MAGIC_LINK_REQUESTED,
    entityType: AUDIT_ENTITIES.AUTH,
    ipAddress,
    userAgent,
    metadata: {
      emailDomain: parsed.data.email.split("@")[1] ?? null,
      providerResponse: error ? "error" : "ok",
    },
  });

  if (error) {
    // Log auth email errors (17.7)
    const { logError } = await import("@/server/logger");
    await logError({
      message: error.message,
      severity: "error",
      context: "email_auth_failed",
      metadata: {
        emailDomain: parsed.data.email.split("@")[1] ?? null,
      },
    });
    return errorResponse("INTERNAL_ERROR", "Unable to send sign-in email");
  }

  return successResponse({
    sent: true,
    message: "If the email is valid, a sign-in link will arrive shortly.",
  });
}
