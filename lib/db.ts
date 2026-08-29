import "server-only";
import postgres from "postgres";

/**
 * Accès à la base PostgreSQL (postgres.js).
 *
 * Compatible avec n'importe quel PostgreSQL : Neon / Vercel Postgres,
 * Supabase, Railway, une instance locale…
 *
 * - Le client est créé paresseusement (rien ne s'exécute à l'import :
 *   le build reste possible sans DATABASE_URL).
 * - Le schéma est créé automatiquement, une fois par instance, au
 *   premier appel de `sql`.
 * - Le mode SSL est lu depuis l'URL (`?sslmode=require` pour Neon, etc.).
 */

type Row = Record<string, unknown>;
type SqlTag = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Row[]>;

type PgClient = ReturnType<typeof postgres>;

const globalForPg = globalThis as unknown as { __nexoraPg?: PgClient };

let client: PgClient | null = globalForPg.__nexoraPg ?? null;

function connection(): SqlTag {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL manquant. Copiez .env.example en .env.local (voir README) " +
          "ou définissez la variable dans Vercel.",
      );
    }
    client = postgres(url, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false, // compatible avec les poolers (pgbouncer / Neon pooled)
    });
    if (process.env.NODE_ENV !== "production") {
      globalForPg.__nexoraPg = client;
    }
  }
  return client as unknown as SqlTag;
}

let schemaReady: Promise<void> | null = null;

/** DDL idempotente pour les fonctionnalités ajoutées après coup. */
async function ensureMigrations(raw: SqlTag): Promise<void> {
  await raw`
    CREATE TABLE IF NOT EXISTS password_resets (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at    TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await raw`CREATE INDEX IF NOT EXISTS idx_pwreset_token ON password_resets (token_hash)`;

  await raw`
    CREATE TABLE IF NOT EXISTS reviews (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      body       TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await raw`CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews (created_at DESC)`;
}

async function ensureSchema(): Promise<void> {
  const raw = connection();

  const check = await raw`SELECT to_regclass('public.subscriptions') AS t`;
  if (check[0]?.t) {
    await ensureMigrations(raw);
    return; // schéma de base déjà en place
  }

  await raw`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'client',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await raw`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label        TEXT NOT NULL DEFAULT 'Abonnement',
      server_url   TEXT NOT NULL DEFAULT '',
      username     TEXT NOT NULL DEFAULT '',
      password_enc TEXT NOT NULL DEFAULT '',
      expires_at   DATE,
      status       TEXT NOT NULL DEFAULT 'active',
      note         TEXT NOT NULL DEFAULT '',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await raw`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id           SERIAL PRIMARY KEY,
      email        TEXT NOT NULL,
      ip           TEXT NOT NULL,
      attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await raw`CREATE INDEX IF NOT EXISTS idx_attempts ON login_attempts (email, ip, attempted_at)`;
  await raw`CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions (user_id)`;

  await ensureMigrations(raw);
}

/**
 * Fonction de requête à utiliser partout : sql`SELECT ...`.
 * Garantit que le schéma existe avant la première requête.
 */
export const sql: SqlTag = async (strings, ...values) => {
  if (!schemaReady) {
    schemaReady = ensureSchema().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
  return connection()(strings, ...values);
};
