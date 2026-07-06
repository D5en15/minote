import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const PORT = Number(process.env.PHASE9_VERIFY_PORT ?? 3109);
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
const TEST_EMAIL = `phase9-${Date.now()}@example.com`;
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
      cookie: cookieHeader(cookieJar),
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
      await jsonRequest(
        "/api/notes",
        {
          method: "POST",
          body: JSON.stringify({
            title: "Existing note",
            contentMarkdown: "Existing cloud note",
          }),
        },
        cookieJar
      );

      const guestPayload = {
        notes: [
          {
            localId: "guest-1",
            title: "Existing note",
            contentMarkdown: "Imported content",
            tags: ["Draft", "งานด่วน"],
          },
          {
            localId: "guest-2",
            title: "Fresh note",
            contentMarkdown: "Second imported note",
            tags: [],
          },
        ],
      };

      const preview = await jsonRequest(
        "/api/import/guest/preview",
        {
          method: "POST",
          body: JSON.stringify(guestPayload),
        },
        cookieJar
      );

      if (
        !preview.response.ok ||
        !preview.data.ok ||
        preview.data.data.importCount !== 2 ||
        preview.data.data.renamedNotes[0]?.finalTitle !==
          "Existing note (Imported from guest)"
      ) {
        throw new Error("Guest import preview verification failed");
      }

      const confirmed = await jsonRequest(
        "/api/import/guest/confirm",
        {
          method: "POST",
          body: JSON.stringify(guestPayload),
        },
        cookieJar
      );

      if (
        !confirmed.response.ok ||
        !confirmed.data.ok ||
        confirmed.data.data.importedCount !== 2
      ) {
        throw new Error("Guest import confirm verification failed");
      }

      const notes = await jsonRequest("/api/notes", { method: "GET" }, cookieJar);

      if (
        !notes.response.ok ||
        !notes.data.ok ||
        notes.data.data.notes.length < 3 ||
        !notes.data.data.notes.some(
          (note) =>
            note.title === "Existing note (Imported from guest)" &&
            note.tags.some((tag) => tag.name === "งานด่วน")
        )
      ) {
        throw new Error("Imported notes verification failed");
      }

      const homeResponse = await fetch(`${BASE_URL}/`);
      const homeHtml = await homeResponse.text();

      if (
        homeResponse.status !== 200 ||
        !homeHtml.includes("ทดลองจดทันที") ||
        !homeHtml.includes("Guest mode warning")
      ) {
        throw new Error("Guest workspace UI verification failed");
      }

      console.log("Phase 9 verification passed");
      console.log("- Guest import preview returns import count and renamed titles");
      console.log("- Guest import confirm merges guest notes into cloud notes");
      console.log("- Imported guest tags include Thai names");
      console.log("- Home route renders guest workspace controls");
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
