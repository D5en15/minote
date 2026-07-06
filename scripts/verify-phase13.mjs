import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";
import crypto from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const PORT = Number(process.env.PHASE13_VERIFY_PORT ?? 3113);
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
const TEST_EMAIL = `phase13-${Date.now()}@example.com`;
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
      // 1. Verify default Billing Status
      const statusRes = await jsonRequest("/api/billing/status", { method: "GET" }, cookieJar);
      if (!statusRes.response.ok || !statusRes.data.ok) {
        throw new Error("Billing status API failed");
      }

      if (statusRes.data.data.isPremium !== false || statusRes.data.data.planId !== "free") {
        throw new Error("Default billing status should be Free plan");
      }

      // 2. Initiate Stripe Checkout Session
      const checkoutRes = await jsonRequest(
        "/api/billing/checkout",
        {
          method: "POST",
          body: JSON.stringify({ priceId: "price_premium_monthly" }),
        },
        cookieJar
      );

      if (!checkoutRes.response.ok || !checkoutRes.data.ok || !checkoutRes.data.data.url) {
        throw new Error("Stripe checkout session initiation failed");
      }

      // 3. Initiate Customer Portal Session
      const portalRes = await jsonRequest("/api/billing/portal", { method: "POST" }, cookieJar);
      if (!portalRes.response.ok || !portalRes.data.ok || !portalRes.data.data.url) {
        throw new Error("Customer portal session initiation failed");
      }

      // 4. Mock and trigger Stripe Webhook for customer.subscription.created
      const stripeSubId = `sub_${crypto.randomBytes(8).toString("hex")}`;
      const stripeCustId = `cus_${crypto.randomBytes(8).toString("hex")}`;
      const stripeEventId = `evt_${crypto.randomBytes(8).toString("hex")}`;
      const webhookPayload = {
        id: stripeEventId,
        type: "customer.subscription.created",
        data: {
          object: {
            id: stripeSubId,
            customer: stripeCustId,
            status: "active",
            cancel_at_period_end: false,
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
            items: {
              data: [
                {
                  price: {
                    id: "price_premium_monthly",
                  },
                },
              ],
            },
            metadata: {
              userId,
            },
          },
        },
      };

      // Since we construct event locally for verification, let's sign it
      const payloadString = JSON.stringify(webhookPayload);
      const timestamp = Math.floor(Date.now() / 1000);
      const signedPayload = `${timestamp}.${payloadString}`;
      const hmac = crypto
        .createHmac("sha256", env.STRIPE_WEBHOOK_SECRET)
        .update(signedPayload)
        .digest("hex");
      const signatureHeader = `t=${timestamp},v1=${hmac}`;

      const webhookResponse = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
        method: "POST",
        headers: {
          "stripe-signature": signatureHeader,
          "content-type": "application/json",
        },
        body: payloadString,
      });

      const webhookResult = await webhookResponse.json();
      if (!webhookResponse.ok || !webhookResult.ok || !webhookResult.data.processed) {
        throw new Error("Webhook processing failed");
      }

      // Verify entitlement upgraded to premium
      const upgradedStatusRes = await jsonRequest("/api/billing/status", { method: "GET" }, cookieJar);
      if (
        !upgradedStatusRes.response.ok ||
        !upgradedStatusRes.data.ok ||
        upgradedStatusRes.data.data.isPremium !== true ||
        upgradedStatusRes.data.data.planId !== "premium_monthly"
      ) {
        throw new Error("User plan did not upgrade after subscription webhook event");
      }

      // 5. Test Webhook Idempotency (Sending same event ID again)
      const duplicateRes = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
        method: "POST",
        headers: {
          "stripe-signature": signatureHeader,
          "content-type": "application/json",
        },
        body: payloadString,
      });

      const duplicateJson = await duplicateRes.json();
      if (!duplicateRes.ok || !duplicateJson.ok || duplicateJson.data.message !== "Duplicate event ignored") {
        throw new Error("Webhook idempotency check failed. Duplicate event was not ignored.");
      }

      console.log("Phase 13 verification passed");
      console.log("- Billing status correctly reports user subscription details");
      console.log("- Stripe checkout/portal session endpoints return redirect URLs properly");
      console.log("- Stripe Webhook validates signatures and processes subscription upserts");
      console.log("- Webhook idempotency ignores already processed Stripe event IDs");
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
