import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const responseWithHeaders = response;

  // Apply Global Security Hardening Headers (16.1)
  responseWithHeaders.headers.set("X-Content-Type-Options", "nosniff");
  responseWithHeaders.headers.set("X-Frame-Options", "DENY");
  responseWithHeaders.headers.set("X-XSS-Protection", "1; mode=block");
  responseWithHeaders.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  responseWithHeaders.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  if (request.nextUrl.pathname.startsWith("/share/")) {
    responseWithHeaders.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
    );
    responseWithHeaders.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    responseWithHeaders.headers.set("X-Robots-Tag", "noindex, nofollow");
    return responseWithHeaders;
  }

  let responseWithAuth = responseWithHeaders;

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          responseWithAuth = NextResponse.next({
            request,
          });
          // Copy global security headers to new NextResponse object
          responseWithAuth.headers.set("X-Content-Type-Options", "nosniff");
          responseWithAuth.headers.set("X-Frame-Options", "DENY");
          responseWithAuth.headers.set("X-XSS-Protection", "1; mode=block");
          responseWithAuth.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
          responseWithAuth.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

          cookiesToSet.forEach(({ name, value, options }) => {
            responseWithAuth.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // App routes CSP setup (16.2)
  responseWithAuth.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
  );
  responseWithAuth.headers.set("Cache-Control", "private, no-store");
  return responseWithAuth;
}

export const config = {
  matcher: ["/app/:path*", "/share/:path*"],
};
