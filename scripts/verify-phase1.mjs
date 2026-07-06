import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Client } from "pg";

function parseDotEnv(source) {
  const env = {};

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

async function loadEnv() {
  const envFile = await readFile(".env", "utf8");
  return { ...parseDotEnv(envFile), ...process.env };
}

function requireDatabaseUrl(env) {
  const databaseUrl = env.SUPABASE_DB_URL || env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing SUPABASE_DB_URL or DATABASE_URL in .env");
  }

  if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
    throw new Error("SUPABASE_DB_URL must be a Postgres URI, not a Supabase HTTPS project URL");
  }

  return databaseUrl;
}

function makeClient(connectionString) {
  return new Client({
    connectionString,
    ssl: connectionString.includes("sslmode=disable")
      ? undefined
      : { rejectUnauthorized: false },
  });
}

async function runSql(client, sql) {
  await client.query(sql);
}

async function ensureAuthUser(client, id, email) {
  await client.query(
    `
      insert into auth.users (
        id,
        aud,
        role,
        email,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      )
      values (
        $1,
        'authenticated',
        'authenticated',
        $2,
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        now(),
        now()
      )
      on conflict (id) do nothing
    `,
    [id, email]
  );
}

async function withAuthenticatedUser(client, userId, callback) {
  await client.query("begin");

  try {
    await client.query("set local role authenticated");
    await client.query("select set_config('request.jwt.claim.sub', $1, true)", [
      userId,
    ]);
    await client.query(
      "select set_config('request.jwt.claim.role', 'authenticated', true)"
    );
    await callback();
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function verifyRls(client) {
  const userA = randomUUID();
  const userB = randomUUID();
  const noteA = randomUUID();
  const noteB = randomUUID();
  const emailA = `phase1-${userA}@example.test`;
  const emailB = `phase1-${userB}@example.test`;

  try {
    await ensureAuthUser(client, userA, emailA);
    await ensureAuthUser(client, userB, emailB);

    await client.query(
      `
        insert into public.notes (id, user_id, title, content_markdown, content_text)
        values
          ($1, $2, 'User A note', 'User A private content', 'User A private content'),
          ($3, $4, 'User B note', 'User B private content', 'User B private content')
      `,
      [noteA, userA, noteB, userB]
    );

    await withAuthenticatedUser(client, userA, async () => {
      const ownNotes = await client.query("select id from public.notes order by id");

      if (ownNotes.rows.length !== 1 || ownNotes.rows[0].id !== noteA) {
        throw new Error("RLS failed: user A could not see exactly their own note");
      }

      const crossUserNotes = await client.query(
        "select id from public.notes where id = $1",
        [noteB]
      );

      if (crossUserNotes.rows.length !== 0) {
        throw new Error("RLS failed: user A can read user B note");
      }
    });

    await withAuthenticatedUser(client, userB, async () => {
      const ownNotes = await client.query("select id from public.notes order by id");

      if (ownNotes.rows.length !== 1 || ownNotes.rows[0].id !== noteB) {
        throw new Error("RLS failed: user B could not see exactly their own note");
      }
    });
  } finally {
    await client.query(
      "delete from auth.users where id = any($1::uuid[])",
      [[userA, userB]]
    );
  }
}

async function main() {
  const env = await loadEnv();
  const connectionString = requireDatabaseUrl(env);
  const migration = await readFile(
    "supabase/migrations/20260706000100_initial_schema.sql",
    "utf8"
  );
  const client = makeClient(connectionString);

  await client.connect();

  try {
    await runSql(client, migration);
    await verifyRls(client);
    console.log("Phase 1 migration and RLS verification passed.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
