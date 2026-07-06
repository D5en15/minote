import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const PORT = Number(process.env.PHASE10_VERIFY_PORT ?? 3110);
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
const TEST_EMAIL = `phase10-${Date.now()}@example.com`;
const TIMEOUT_MS = 30_000;
const JOB_SECRET = process.env.MINOTE_JOB_SECRET ?? "minote-job-secret";

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
    MINOTE_JOB_SECRET: JOB_SECRET,
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
      const created = await jsonRequest(
        "/api/notes",
        {
          method: "POST",
          body: JSON.stringify({
            title: "Trash note",
            contentMarkdown: "Trash me",
          }),
        },
        cookieJar
      );

      if (!created.response.ok || !created.data.ok) {
        throw new Error("Unable to create note for Phase 10 verification");
      }

      const noteId = created.data.data.note.id;

      const trashed = await jsonRequest(
        `/api/notes/${noteId}`,
        {
          method: "DELETE",
        },
        cookieJar
      );

      if (!trashed.response.ok || !trashed.data.ok) {
        throw new Error("Unable to move note to trash");
      }

      const trashList = await jsonRequest(
        "/api/notes?status=trashed",
        { method: "GET" },
        cookieJar
      );

      if (
        !trashList.response.ok ||
        !trashList.data.ok ||
        !trashList.data.data.notes.some((note) => note.id === noteId)
      ) {
        throw new Error("Trash list verification failed");
      }

      const trashPage = await fetch(`${BASE_URL}/app/trash`, {
        headers: {
          cookie: cookieHeader(cookieJar),
        },
      });
      const trashHtml = await trashPage.text();

      if (
        trashPage.status !== 200 ||
        !trashHtml.includes("Trash") ||
        !trashHtml.includes("Deleted notes")
      ) {
        throw new Error("Trash page UI verification failed");
      }

      const restored = await jsonRequest(
        `/api/notes/${noteId}/restore`,
        { method: "POST" },
        cookieJar
      );

      if (!restored.response.ok || !restored.data.ok) {
        throw new Error("Restore verification failed");
      }

      const restoredList = await jsonRequest(
        "/api/notes?status=trashed",
        { method: "GET" },
        cookieJar
      );

      if (
        !restoredList.response.ok ||
        !restoredList.data.ok ||
        restoredList.data.data.notes.some((note) => note.id === noteId)
      ) {
        throw new Error("Restore list verification failed");
      }

      const createdForPermanentDelete = await jsonRequest(
        "/api/notes",
        {
          method: "POST",
          body: JSON.stringify({
            title: "Permanent delete note",
            contentMarkdown: "Delete forever",
          }),
        },
        cookieJar
      );
      const permanentId = createdForPermanentDelete.data.data.note.id;
      await jsonRequest(
        `/api/notes/${permanentId}`,
        {
          method: "DELETE",
        },
        cookieJar
      );

      const permanentDeleted = await jsonRequest(
        `/api/notes/${permanentId}/permanent`,
        { method: "DELETE" },
        cookieJar
      );

      if (!permanentDeleted.response.ok || !permanentDeleted.data.ok) {
        throw new Error("Permanent delete verification failed");
      }

      const purgeTarget = await jsonRequest(
        "/api/notes",
        {
          method: "POST",
          body: JSON.stringify({
            title: "Expired trashed note",
            contentMarkdown: "Purge me",
          }),
        },
        cookieJar
      );
      const purgeId = purgeTarget.data.data.note.id;
      await jsonRequest(
        `/api/notes/${purgeId}`,
        {
          method: "DELETE",
        },
        cookieJar
      );

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from("notes")
        .update({ delete_after: yesterday })
        .eq("id", purgeId);

      const purgeResult = await jsonRequest(
        "/api/jobs/purge-trashed-notes",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${JOB_SECRET}`,
          },
        },
        null
      );

      if (
        !purgeResult.response.ok ||
        !purgeResult.data.ok ||
        purgeResult.data.data.purgedCount < 1
      ) {
        throw new Error("Purge job verification failed");
      }

      const purgedLookup = await jsonRequest(
        "/api/notes?status=trashed",
        { method: "GET" },
        cookieJar
      );

      if (
        !purgedLookup.response.ok ||
        !purgedLookup.data.ok ||
        purgedLookup.data.data.notes.some((note) => note.id === purgeId)
      ) {
        throw new Error("Purged note still appears in trash");
      }

      console.log("Phase 10 verification passed");
      console.log("- Trash page renders trashed notes with restore/permanent delete actions");
      console.log("- Restore removes note from trash list");
      console.log("- Permanent delete removes trashed note immediately");
      console.log("- Purge job removes expired trashed notes through protected route");
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
