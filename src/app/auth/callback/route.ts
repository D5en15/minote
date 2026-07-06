import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { AUDIT_ENTITIES, AUDIT_EVENTS } from "@/server/audit-events";
import { writeAuditLog } from "@/server/audit";
import { ensureProfileForUser } from "@/server/auth";
import { getClientIp, getUserAgent } from "@/server/request";
import { createServerSupabaseClient } from "@/server/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const error = request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get("error_description");

  if (error || (!code && (!tokenHash || !type))) {
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set(
      "auth_error",
      errorDescription || "Authentication failed"
    );
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createServerSupabaseClient();
  const { error: exchangeError } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash!,
        type: type!,
      });

  if (exchangeError) {
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("auth_error", "Unable to complete sign in");
    return NextResponse.redirect(redirectUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      await ensureProfileForUser(user);
      await writeAuditLog({
        actorUserId: user.id,
        eventType: AUDIT_EVENTS.AUTH_LOGIN,
        entityType: AUDIT_ENTITIES.AUTH,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
    } catch (profileOrAuditError) {
      console.error("Auth callback post-login task failed", profileOrAuditError);
    }
  }

  return NextResponse.redirect(new URL("/app", request.url));
}
