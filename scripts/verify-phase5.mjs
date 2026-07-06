import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const PORT = Number(process.env.PHASE5_VERIFY_PORT ?? 3105);
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
const TEST_EMAIL = `phase5-${Date.now()}@example.com`;
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

  throw new Error(`Timed out waiting for dev server at ${url}`);
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
      throw new Error("Redirect response missing Location header");
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

    const response = await followRedirects(callbackUrl.toString(), cookieJar);

    if (new URL(response.url).pathname !== "/app") {
      throw new Error(`Expected auth callback to end at /app, got ${response.url}`);
    }

    return { supabase, userId, cookieJar };
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
      ...(cookieJar.size ? { cookie: cookieHeader(cookieJar) } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const payload = await response.json();
  return { response, payload };
}

async function main() {
  const localEnv = await loadLocalEnv();
  const env = {
    ...process.env,
    ...localEnv,
    NEXT_PUBLIC_APP_URL: BASE_URL,
  };

  const missing = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ].filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required env keys: ${missing.join(", ")}`);
  }

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
    const { supabase, userId, cookieJar } = await signInWithTestUser(env);

    try {
      const created = await jsonRequest(
        "/api/notes",
        {
          method: "POST",
          body: JSON.stringify({
            title: "Phase 5 Note",
            contentMarkdown: "Hello **Minote**",
          }),
        },
        cookieJar
      );

      if (created.response.status !== 201 || !created.payload.ok) {
        throw new Error("Create note API verification failed");
      }

      const noteId = created.payload.data.note.id;

      const listed = await jsonRequest("/api/notes?search=Phase%205", {}, cookieJar);
      if (!listed.payload.ok || listed.payload.data.notes.length !== 1) {
        throw new Error("List notes API verification failed");
      }

      const fetched = await jsonRequest(`/api/notes/${noteId}`, {}, cookieJar);
      if (!fetched.payload.ok || fetched.payload.data.note.id !== noteId) {
        throw new Error("Get note by id API verification failed");
      }

      const updated = await jsonRequest(
        `/api/notes/${noteId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: "Updated Phase 5 Note",
            contentMarkdown: "Updated content",
            baseRevision: created.payload.data.note.revision,
          }),
        },
        cookieJar
      );

      if (!updated.payload.ok || updated.payload.data.note.revision !== 2) {
        throw new Error("Update note API verification failed");
      }

      const conflict = await jsonRequest(
        `/api/notes/${noteId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            contentMarkdown: "Conflict update",
            baseRevision: 1,
          }),
        },
        cookieJar
      );

      if (
        conflict.response.status !== 409 ||
        conflict.payload.error?.code !== "REVISION_CONFLICT" ||
        conflict.payload.serverRevision !== 2
      ) {
        throw new Error("Revision conflict API verification failed");
      }

      const deleted = await jsonRequest(
        `/api/notes/${noteId}`,
        { method: "DELETE" },
        cookieJar
      );

      if (
        !deleted.payload.ok ||
        deleted.payload.data.note.status !== "trashed" ||
        !deleted.payload.data.note.delete_after
      ) {
        throw new Error("Soft delete API verification failed");
      }

      const trashedList = await jsonRequest(
        "/api/notes?status=trashed",
        {},
        cookieJar
      );
      if (!trashedList.payload.ok || trashedList.payload.data.notes.length !== 1) {
        throw new Error("List trashed notes verification failed");
      }

      const restored = await jsonRequest(
        `/api/notes/${noteId}/restore`,
        { method: "POST", body: JSON.stringify({}) },
        cookieJar
      );

      if (
        !restored.payload.ok ||
        restored.payload.data.note.status !== "active" ||
        restored.payload.data.note.trashed_at !== null
      ) {
        throw new Error("Restore note API verification failed");
      }

      const permanent = await jsonRequest(
        `/api/notes/${noteId}/permanent`,
        { method: "DELETE" },
        cookieJar
      );

      if (!permanent.payload.ok || permanent.payload.data.note.id !== noteId) {
        throw new Error("Permanent delete API verification failed");
      }

      console.log("Phase 5 verification passed");
      console.log("- Create note");
      console.log("- List notes with search/status");
      console.log("- Get note by id");
      console.log("- Update note and increment revision");
      console.log("- Return revision conflict");
      console.log("- Soft delete note");
      console.log("- Restore note");
      console.log("- Permanent delete note");
    } finally {
      await supabase.auth.admin.deleteUser(userId);
    }
  } catch (error) {
    if (stderr.trim()) {
      console.error(stderr.trim().split("\n").slice(-40).join("\n"));
    }
    throw error;
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
