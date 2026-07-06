import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const PORT = Number(process.env.PHASE8_VERIFY_PORT ?? 3108);
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
const TEST_EMAIL = `phase8-${Date.now()}@example.com`;
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
      const first = await jsonRequest(
        "/api/notes",
        {
          method: "POST",
          body: JSON.stringify({
            title: "Phase 8 Note A",
            contentMarkdown: "Tag test",
          }),
        },
        cookieJar
      );
      const second = await jsonRequest(
        "/api/notes",
        {
          method: "POST",
          body: JSON.stringify({
            title: "Phase 8 Note B",
            contentMarkdown: "Tag dedupe test",
          }),
        },
        cookieJar
      );

      if (!first.response.ok || !second.response.ok) {
        throw new Error("Unable to create notes for Phase 8 verification");
      }

      const noteA = first.data.data.note;
      const noteB = second.data.data.note;

      const attachWorkA = await jsonRequest(
        `/api/notes/${noteA.id}/tags`,
        {
          method: "POST",
          body: JSON.stringify({ name: "Work" }),
        },
        cookieJar
      );
      const attachWorkB = await jsonRequest(
        `/api/notes/${noteB.id}/tags`,
        {
          method: "POST",
          body: JSON.stringify({ name: "work" }),
        },
        cookieJar
      );
      const attachThai = await jsonRequest(
        `/api/notes/${noteA.id}/tags`,
        {
          method: "POST",
          body: JSON.stringify({ name: "งานด่วน" }),
        },
        cookieJar
      );

      if (
        !attachWorkA.response.ok ||
        !attachWorkB.response.ok ||
        !attachThai.response.ok
      ) {
        throw new Error("Tag attach verification failed");
      }

      const workTagA = attachWorkA.data.data.note.tags.find(
        (tag) => tag.normalized_name === "work"
      );
      const workTagB = attachWorkB.data.data.note.tags.find(
        (tag) => tag.normalized_name === "work"
      );

      if (!workTagA || !workTagB || workTagA.id !== workTagB.id) {
        throw new Error("Case-insensitive tag reuse verification failed");
      }

      const tagsResponse = await jsonRequest("/api/tags", { method: "GET" }, cookieJar);

      if (
        !tagsResponse.response.ok ||
        !tagsResponse.data.ok ||
        !tagsResponse.data.data.tags.some((tag) => tag.name === "งานด่วน")
      ) {
        throw new Error("Tag list verification failed");
      }

      const filtered = await jsonRequest(
        `/api/notes?tag=${workTagA.id}`,
        { method: "GET" },
        cookieJar
      );

      if (
        !filtered.response.ok ||
        !filtered.data.ok ||
        filtered.data.data.notes.length !== 2
      ) {
        throw new Error("Tag filter verification failed");
      }

      const detached = await jsonRequest(
        `/api/notes/${noteA.id}/tags/${workTagA.id}`,
        { method: "DELETE" },
        cookieJar
      );

      if (!detached.response.ok || !detached.data.ok) {
        throw new Error("Tag detach verification failed");
      }

      const filteredAfterDetach = await jsonRequest(
        `/api/notes?tag=${workTagA.id}`,
        { method: "GET" },
        cookieJar
      );

      if (
        !filteredAfterDetach.response.ok ||
        !filteredAfterDetach.data.ok ||
        filteredAfterDetach.data.data.notes.length !== 1 ||
        filteredAfterDetach.data.data.notes[0].id !== noteB.id
      ) {
        throw new Error("Tag detach filter verification failed");
      }

      const editorResponse = await fetch(`${BASE_URL}/app/notes/${noteB.id}`, {
        headers: {
          cookie: cookieHeader(cookieJar),
        },
      });
      const editorHtml = await editorResponse.text();

      if (
        editorResponse.status !== 200 ||
        !editorHtml.includes("Add a tag") ||
        !editorHtml.includes("work")
      ) {
        throw new Error("Editor tag UI verification failed");
      }

      console.log("Phase 8 verification passed");
      console.log("- Tag attach reuses normalized tags across case differences");
      console.log("- Thai tag values are preserved and listed");
      console.log("- Notes filter by tag and update after detach");
      console.log("- Editor route renders tag input and tag chips");
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
