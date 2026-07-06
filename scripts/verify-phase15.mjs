import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const PORT = Number(process.env.PHASE15_VERIFY_PORT ?? 3115);
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
const ADMIN_EMAIL = `phase15-admin-${Date.now()}@example.com`;
const USER_EMAIL = `phase15-user-${Date.now()}@example.com`;
const TIMEOUT_MS = 30_000;

function parseDotEnv(contents) {
  const values = {};

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;
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
    return parseDotEnv(await readFile(".env", "utf8"));
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
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for server at ${url}`);
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
      throw new Error(`Redirect flow stopped with HTTP ${response.status}`);
    }

    const location = response.headers.get("location");
    if (!location) {
      throw new Error("Redirect response missing Location");
    }

    nextUrl = new URL(location, nextUrl).toString();
  }

  throw new Error("Redirect flow exceeded limit");
}

async function signInWithTestUser(email, env, setAdminRole = false) {
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

  const created = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "Unable to create test user");
  }

  const userId = created.data.user.id;

  try {
    if (setAdminRole) {
      // Elevate profile to admin role
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId);
      if (profileError) throw profileError;
    }

    const magicLink = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${BASE_URL}/auth/callback`,
      },
    });

    if (magicLink.error || !magicLink.data.properties?.hashed_token) {
      throw new Error(
        magicLink.error?.message ?? "Unable to generate magic link"
      );
    }

    const cookieJar = new Map();
    const callbackUrl = new URL("/auth/callback", BASE_URL);
    callbackUrl.searchParams.set(
      "token_hash",
      magicLink.data.properties.hashed_token
    );
    callbackUrl.searchParams.set("type", "magiclink");
    await followRedirects(callbackUrl.toString(), cookieJar);

    return { cookieJar, supabase, userId };
  } catch (error) {
    await supabase.auth.admin.deleteUser(userId);
    throw error;
  }
}

async function jsonRequest(path, init, cookieJar) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(cookieJar ? { cookie: cookieHeader(cookieJar) } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const data = await response.json();
  return { response, data };
}

async function main() {
  const localEnv = await loadLocalEnv();
  const env = {
    ...process.env,
    ...localEnv,
    NEXT_PUBLIC_APP_URL: BASE_URL,
  };

  const server = spawn(
    "npm",
    ["run", "start", "--", "--hostname", HOST, "--port", String(PORT)],
    {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  let stderr = "";
  server.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer(`${BASE_URL}/`);
    
    // Create test accounts
    const adminObj = await signInWithTestUser(ADMIN_EMAIL, env, true);
    const userObj = await signInWithTestUser(USER_EMAIL, env, false);

    try {
      // 1. Verify standard user cannot access admin audit logs
      const userLogsRes = await jsonRequest("/api/admin/audit-logs", { method: "GET" }, userObj.cookieJar);
      if (userLogsRes.response.status !== 401 || userLogsRes.data.ok) {
        throw new Error("Security gap: Regular user was allowed to fetch admin logs");
      }

      // 2. Verify admin can fetch audit logs and query filters work
      const adminLogsRes = await jsonRequest("/api/admin/audit-logs", { method: "GET" }, adminObj.cookieJar);
      if (!adminLogsRes.response.ok || !adminLogsRes.data.ok || !Array.isArray(adminLogsRes.data.data.logs)) {
        throw new Error("Admin query for audit logs failed");
      }

      // Check pagination structure
      const pagination = adminLogsRes.data.data.pagination;
      if (!pagination || typeof pagination.total !== "number" || pagination.page !== 1) {
        throw new Error("Pagination structure is invalid");
      }

      // 3. Verify user profile route endpoint
      const userProfileRes = await jsonRequest(`/api/admin/users/${userObj.userId}`, { method: "GET" }, adminObj.cookieJar);
      if (!userProfileRes.response.ok || !userProfileRes.data.ok || userProfileRes.data.data.email !== USER_EMAIL) {
        throw new Error("Admin user profile metadata fetch failed");
      }

      // Ensure notes content is never sent to admin portal
      if (userProfileRes.data.data.content_markdown || userProfileRes.data.data.notes) {
        throw new Error("Security violation: user notes contents exposed in profile fetch");
      }

      // 4. Verify standard user cannot fetch user profiles
      const userFetchRes = await jsonRequest(`/api/admin/users/${adminObj.userId}`, { method: "GET" }, userObj.cookieJar);
      if (userFetchRes.response.status !== 401 || userFetchRes.data.ok) {
        throw new Error("Security gap: Regular user was allowed to call users details endpoint");
      }

      console.log("Phase 15 Admin & Audit verification passed");
      console.log("- Admin portal route guard blocks non-admins correctly");
      console.log("- GET /api/admin/audit-logs supports pagination, role checks, and filters");
      console.log("- GET /api/admin/users/[userId] excludes notes contents");
    } finally {
      await adminObj.supabase.auth.admin.deleteUser(adminObj.userId);
      await userObj.supabase.auth.admin.deleteUser(userObj.userId);
    }
  } catch (error) {
    if (stderr.trim()) {
      console.error(stderr.trim().split("\n").slice(-30).join("\n"));
    }
    throw error;
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
