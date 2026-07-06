import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const PORT = Number(process.env.PHASE11_VERIFY_PORT ?? 3111);
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
const TEST_EMAIL = `phase11-${Date.now()}@example.com`;
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
      const created = await jsonRequest(
        "/api/notes",
        {
          method: "POST",
          body: JSON.stringify({
            title: "Shared note",
            contentMarkdown:
              "# Shared Title\n\n[unsafe](javascript:alert(1))\n\n<script>alert(1)</script>\n\nVisible content",
          }),
        },
        cookieJar
      );

      if (!created.response.ok || !created.data.ok) {
        throw new Error("Unable to create note for Phase 11 verification");
      }

      const noteId = created.data.data.note.id;

      const createdShare = await jsonRequest(
        `/api/notes/${noteId}/share`,
        { method: "POST" },
        cookieJar
      );

      if (
        createdShare.response.status !== 201 ||
        !createdShare.data.ok ||
        !createdShare.data.data.shareUrl
      ) {
        throw new Error("Share creation verification failed");
      }

      const shareUrl = createdShare.data.data.shareUrl;
      const sharedResponse = await fetch(shareUrl);
      const sharedHtml = await sharedResponse.text();

      if (
        sharedResponse.status !== 200 ||
        !sharedHtml.includes("Visible content") ||
        !sharedHtml.includes("Shared note") ||
        sharedHtml.includes(TEST_EMAIL) ||
        sharedHtml.includes(userId) ||
        sharedHtml.includes("javascript:alert") ||
        !sharedResponse.headers.get("content-security-policy") ||
        !sharedResponse.headers.get("x-robots-tag")?.includes("noindex")
      ) {
        throw new Error("Shared page verification failed");
      }

      const editorResponse = await fetch(`${BASE_URL}/app/notes/${noteId}`, {
        headers: {
          cookie: cookieHeader(cookieJar),
        },
      });
      const editorHtml = await editorResponse.text();

      if (
        editorResponse.status !== 200 ||
        !editorHtml.includes("Share") ||
        !editorHtml.includes("Delete")
      ) {
        throw new Error("Editor share controls verification failed");
      }

      const regenerated = await jsonRequest(
        `/api/notes/${noteId}/share/regenerate`,
        { method: "POST" },
        cookieJar
      );

      if (!regenerated.response.ok || !regenerated.data.ok) {
        throw new Error("Share regeneration verification failed");
      }

      const oldShareAfterRegenerate = await fetch(shareUrl, {
        redirect: "manual",
      });

      if (oldShareAfterRegenerate.status !== 404) {
        throw new Error("Old share link still works after regeneration");
      }

      const regeneratedUrl = regenerated.data.data.shareUrl;
      const sharedAfterRegenerate = await fetch(regeneratedUrl);

      if (sharedAfterRegenerate.status !== 200) {
        throw new Error("Regenerated share link verification failed");
      }

      const revoked = await jsonRequest(
        `/api/notes/${noteId}/share`,
        { method: "DELETE" },
        cookieJar
      );

      if (!revoked.response.ok || !revoked.data.ok) {
        throw new Error("Share revoke verification failed");
      }

      const revokedPage = await fetch(regeneratedUrl, {
        redirect: "manual",
      });

      if (revokedPage.status !== 404) {
        throw new Error("Revoked share link still works");
      }

      const createdShareForTrash = await jsonRequest(
        `/api/notes/${noteId}/share`,
        { method: "POST" },
        cookieJar
      );

      const shareBeforeTrash = createdShareForTrash.data.data.shareUrl;
      await jsonRequest(
        `/api/notes/${noteId}`,
        { method: "DELETE" },
        cookieJar
      );

      const trashedSharedPage = await fetch(shareBeforeTrash, {
        redirect: "manual",
      });

      if (trashedSharedPage.status !== 404) {
        throw new Error("Share link still works after note is trashed");
      }

      console.log("Phase 11 verification passed");
      console.log("- Share create returns public URL and public page renders read-only note");
      console.log("- Shared page is noindex, has CSP header, and hides owner/internal ids");
      console.log("- Revoke and regenerate invalidate old links");
      console.log("- Trashed notes cannot be opened through shared links");
      console.log("- Unsafe markdown link protocols do not survive shared rendering");
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
