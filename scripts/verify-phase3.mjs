import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const PORT = Number(process.env.PHASE3_VERIFY_PORT ?? 3103);
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
const TEST_EMAIL = `phase3-${Date.now()}@example.com`;
const TIMEOUT_MS = 30_000;

function parseDotEnv(contents) {
  const values = {};

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

async function loadLocalEnv() {
  try {
    const envFile = await readFile(".env", "utf8");
    return parseDotEnv(envFile);
  } catch {
    return {};
  }
}

function collectCookies(response, cookieJar) {
  const setCookie =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : response.headers.get("set-cookie")
        ? [response.headers.get("set-cookie")]
        : [];

  for (const cookie of setCookie) {
    const [pair] = cookie.split(";");
    const [name, ...valueParts] = pair.split("=");

    if (name && valueParts.length > 0) {
      cookieJar.set(name.trim(), valueParts.join("=").trim());
    }
  }
}

function cookieHeader(cookieJar) {
  return [...cookieJar.entries()]
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function waitForServer(url) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < TIMEOUT_MS) {
    try {
      const response = await fetch(url, { redirect: "manual" });

      if (response.status < 500) {
        return;
      }
    } catch {
      // Keep polling until Next finishes compiling the first route.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for dev server at ${url}`);
}

async function waitForStableRoute(url) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < TIMEOUT_MS) {
    try {
      const response = await fetch(url, { redirect: "manual" });

      if (response.status < 500) {
        return;
      }
    } catch {
      // Keep polling while the route compiler/server is still warming.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for stable route at ${url}`);
}

async function expectRedirectFromProtectedApp(cookieJar) {
  const response = await fetch(`${BASE_URL}/app`, {
    headers: cookieJar.size ? { cookie: cookieHeader(cookieJar) } : undefined,
    redirect: "manual",
  });

  if (![307, 308].includes(response.status)) {
    throw new Error(`Expected /app redirect, received HTTP ${response.status}`);
  }

  const location = response.headers.get("location") ?? "";

  if (!location.includes("/?redirectedFrom=%2Fapp")) {
    throw new Error(`Unexpected /app redirect target: ${location}`);
  }
}

async function expectMagicLinkEndpointValidation() {
  const response = await fetch(`${BASE_URL}/api/auth/magic-link`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "invalid-email" }),
  });
  const payload = await response.json();

  if (response.status !== 400 || payload?.error?.code !== "VALIDATION_ERROR") {
    throw new Error("Magic link endpoint did not reject invalid email");
  }
}

async function expectAuthCallbackErrorRedirect() {
  const response = await fetch(
    `${BASE_URL}/auth/callback?error=access_denied&error_description=Denied`,
    { redirect: "manual" }
  );

  if (![307, 308].includes(response.status)) {
    throw new Error(
      `Expected auth callback error redirect, received HTTP ${response.status}`
    );
  }

  const location = response.headers.get("location") ?? "";

  if (!location.includes("/?auth_error=Denied")) {
    throw new Error(`Unexpected auth error redirect target: ${location}`);
  }
}

async function expectGoogleOAuthUrl(env) {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: "pkce",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${BASE_URL}/auth/callback`,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    throw new Error("Unable to generate Google OAuth URL");
  }

  const oauthUrl = new URL(data.url);

  if (!oauthUrl.pathname.includes("/auth/v1/authorize")) {
    throw new Error(`Unexpected Google OAuth URL path: ${oauthUrl.pathname}`);
  }
}

async function followRedirects(startUrl, cookieJar) {
  let nextUrl = startUrl;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await fetch(nextUrl, {
      headers: cookieJar.size ? { cookie: cookieHeader(cookieJar) } : undefined,
      redirect: "manual",
    });

    collectCookies(response, cookieJar);

    if (response.status >= 200 && response.status < 300) {
      return response;
    }

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      throw new Error(`Redirect flow stopped with unexpected HTTP ${response.status}`);
    }

    const location = response.headers.get("location");

    if (!location) {
      throw new Error("Magic link redirect response did not include Location");
    }

    nextUrl = new URL(location, nextUrl).toString();
  }

  throw new Error("Redirect flow exceeded redirect limit");
}

async function expectMagicLinkLoginAndLogout(env) {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
  let userId = null;

  try {
    const { data: createdUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: TEST_EMAIL,
        email_confirm: true,
      });

    if (createError || !createdUser.user) {
      throw new Error(createError?.message ?? "Unable to create test user");
    }

    userId = createdUser.user.id;

    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: TEST_EMAIL,
        options: {
          redirectTo: `${BASE_URL}/auth/callback`,
        },
      });

    if (linkError || !linkData.properties?.hashed_token) {
      throw new Error(linkError?.message ?? "Unable to generate magic link");
    }

    const cookieJar = new Map();
    const callbackUrl = new URL("/auth/callback", BASE_URL);
    callbackUrl.searchParams.set("token_hash", linkData.properties.hashed_token);
    callbackUrl.searchParams.set("type", "magiclink");
    const finalResponse = await followRedirects(
      callbackUrl.toString(),
      cookieJar
    );

    if (new URL(finalResponse.url).pathname !== "/app") {
      throw new Error(`Magic link final URL was ${finalResponse.url}`);
    }

    if (cookieJar.size === 0) {
      throw new Error("Magic link callback did not set session cookies");
    }

    const protectedResponse = await fetch(`${BASE_URL}/app`, {
      headers: { cookie: cookieHeader(cookieJar) },
      redirect: "manual",
    });

    if (protectedResponse.status !== 200) {
      throw new Error(
        `Authenticated /app request returned HTTP ${protectedResponse.status}`
      );
    }

    const logoutResponse = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { cookie: cookieHeader(cookieJar) },
    });
    const logoutPayload = await logoutResponse.json();

    collectCookies(logoutResponse, cookieJar);

    if (!logoutResponse.ok || logoutPayload?.data?.signedOut !== true) {
      throw new Error("Logout endpoint did not return signedOut=true");
    }

    await expectRedirectFromProtectedApp(cookieJar);
  } finally {
    if (userId) {
      await supabase.auth.admin.deleteUser(userId);
    }
  }
}

async function main() {
  const localEnv = await loadLocalEnv();
  const env = {
    ...process.env,
    ...localEnv,
    NEXT_PUBLIC_APP_URL: BASE_URL,
  };
  const requiredEnv = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const missing = requiredEnv.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required env keys: ${missing.join(", ")}`);
  }

  const server = spawn(
    "npm",
    ["run", "dev", "--", "--hostname", HOST, "--port", String(PORT)],
    {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  let stderr = "";
  let stdout = "";

  server.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });

  server.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer(`${BASE_URL}/`);
    await waitForStableRoute(`${BASE_URL}/app`);
    await expectRedirectFromProtectedApp(new Map());
    await expectMagicLinkEndpointValidation();
    await expectAuthCallbackErrorRedirect();
    await expectGoogleOAuthUrl(env);
    await expectMagicLinkLoginAndLogout(env);

    console.log("Phase 3 verification passed");
    console.log("- Unauthenticated /app redirects to /");
    console.log("- Magic Link endpoint validates invalid email");
    console.log("- Auth callback error redirects to / with auth_error");
    console.log("- Google OAuth authorization URL can be generated");
    console.log("- Magic Link callback creates an authenticated /app session");
    console.log("- Logout clears access to /app");
  } catch (error) {
    const recentOutput = `${stdout}\n${stderr}`.trim().split("\n").slice(-40);

    if (recentOutput.length > 0 && recentOutput[0] !== "") {
      console.error("Recent dev server output:");
      console.error(recentOutput.join("\n"));
    }

    throw error;
  } finally {
    server.kill("SIGTERM");
  }

  if (server.exitCode && server.exitCode !== 0 && stderr) {
    process.stderr.write(stderr);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
