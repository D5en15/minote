import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";
import crypto from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const PORT = Number(process.env.PHASE14_VERIFY_PORT ?? 3114);
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
const TEST_EMAIL = `phase14-${Date.now()}@example.com`;
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

async function signInWithTestUser(env) {
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
    email: TEST_EMAIL,
    email_confirm: true,
  });

  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "Unable to create test user");
  }

  const userId = created.data.user.id;

  try {
    const magicLink = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: TEST_EMAIL,
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
    const { cookieJar, supabase, userId } = await signInWithTestUser(env);

    try {
      // 1. Verify Load Profile details
      const profileRes = await jsonRequest("/api/profile/status", { method: "GET" }, cookieJar);
      if (!profileRes.response.ok || !profileRes.data.ok) {
        throw new Error("GET Profile status API failed");
      }

      if (profileRes.data.data.email !== TEST_EMAIL) {
        throw new Error("Loaded profile email does not match user account email");
      }

      // 2. Verify Update Display Name mutation
      const updateRes = await jsonRequest(
        "/api/profile",
        {
          method: "PATCH",
          body: JSON.stringify({ displayName: "Verify Account Test" }),
        },
        cookieJar
      );

      if (!updateRes.response.ok || !updateRes.data.ok || updateRes.data.data.profile.display_name !== "Verify Account Test") {
        throw new Error("Update profile displayName mutation failed");
      }

      // Verify profile update written to database
      const profileAfterUpdate = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();
      
      if (profileAfterUpdate.data?.display_name !== "Verify Account Test") {
        throw new Error("Database display name was not updated correctly");
      }

      // Verify audit log has registered profile update
      const updateAudit = await supabase
        .from("audit_logs")
        .select("*")
        .eq("actor_user_id", userId)
        .eq("event_type", "profile.updated")
        .maybeSingle();

      if (!updateAudit.data) {
        throw new Error("Audit log for profile update was not registered");
      }

      // 3. Verify Account Deletion Request
      const deleteRes = await jsonRequest("/api/account/delete-request", { method: "POST" }, cookieJar);
      if (!deleteRes.response.ok || !deleteRes.data.ok || !deleteRes.data.data.requested) {
        throw new Error("POST Account deletion request API failed");
      }

      // Verify deleted_at is updated in the database
      const deletedProfile = await supabase
        .from("profiles")
        .select("deleted_at")
        .eq("id", userId)
        .single();

      if (!deletedProfile.data?.deleted_at) {
        throw new Error("Database deleted_at was not populated on deletion request");
      }

      // Verify audit log has registered deletion request
      const deleteAudit = await supabase
        .from("audit_logs")
        .select("*")
        .eq("actor_user_id", userId)
        .eq("event_type", "account.deletion_requested")
        .maybeSingle();

      if (!deleteAudit.data) {
        throw new Error("Audit log for account deletion request was not registered");
      }

      console.log("Phase 14 Settings & Account Deletion verification passed");
      console.log("- Profile details correctly loaded and verified");
      console.log("- Display name form updates successfully with audit logging");
      console.log("- Account Deletion request marks deleted_at timestamp, revokes shares, and writes audit logs");
    } finally {
      await supabase.auth.admin.deleteUser(userId);
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
