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

/**
 * Version courante du schéma. À incrémenter dès qu'on ajoute une migration
 * dans `ensureMigrations`. Tant que la base est déjà à cette version, on
 * saute entièrement le bloc DDL au démarrage (≈ 2 requêtes au lieu de 30).
 */
const SCHEMA_VERSION = 5;

async function readSchemaVersion(raw: SqlTag): Promise<number> {
  try {
    const r = await raw`SELECT value FROM app_meta WHERE key = 'schema_version'`;
    return Number((r[0] as { value?: string } | undefined)?.value) || 0;
  } catch {
    return 0; // table absente = base pas encore migrée
  }
}

/** DDL idempotente pour les fonctionnalités ajoutées après coup. */
async function ensureMigrations(raw: SqlTag): Promise<void> {
  await raw`
    CREATE TABLE IF NOT EXISTS app_meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;

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

  await raw`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS screens SMALLINT`;

  /* ---------- Intégration GoldenOTT ---------- */

  // Colonnes ajoutées à `subscriptions` pour relier un abonnement local à
  // son équivalent distant sur le panel GoldenOTT.
  await raw`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'manual'`;
  await raw`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_kind TEXT`;
  await raw`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_ref TEXT`;
  await raw`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS package_id INTEGER`;
  await raw`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS package_label TEXT`;
  await raw`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_status TEXT`;
  await raw`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS mac TEXT`;
  await raw`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS qr_url TEXT`;
  await raw`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ`;
  await raw`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS dns_domain_id INTEGER`;
  await raw`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS dns_domain TEXT`;

  // Offres publiques : un forfait GoldenOTT « emballé » pour la vente
  // (nom commercial, prix en euros, durée) que le client peut commander.
  await raw`
    CREATE TABLE IF NOT EXISTS iptv_offers (
      id                     SERIAL PRIMARY KEY,
      kind                   TEXT NOT NULL DEFAULT 'line',
      goldenott_package_id   INTEGER NOT NULL,
      goldenott_template_id  INTEGER,
      title                  TEXT NOT NULL,
      tagline                TEXT NOT NULL DEFAULT '',
      duration_label         TEXT NOT NULL DEFAULT '',
      price_cents            INTEGER NOT NULL DEFAULT 0,
      max_connections        SMALLINT,
      is_adult               BOOLEAN NOT NULL DEFAULT false,
      active                 BOOLEAN NOT NULL DEFAULT true,
      sort                   INTEGER NOT NULL DEFAULT 0,
      created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  // Choix du nombre d'écrans par le client, avec supplément par écran.
  await raw`ALTER TABLE iptv_offers ADD COLUMN IF NOT EXISTS included_screens SMALLINT NOT NULL DEFAULT 1`;
  await raw`ALTER TABLE iptv_offers ADD COLUMN IF NOT EXISTS allow_screens BOOLEAN NOT NULL DEFAULT false`;
  await raw`ALTER TABLE iptv_offers ADD COLUMN IF NOT EXISTS extra_screen_cents INTEGER NOT NULL DEFAULT 300`;
  await raw`ALTER TABLE iptv_offers ADD COLUMN IF NOT EXISTS max_screens SMALLINT NOT NULL DEFAULT 5`;
  // Bandeau mis en avant sur la page Commander (ex. « Best Seller »). Vide = pas de bandeau.
  await raw`ALTER TABLE iptv_offers ADD COLUMN IF NOT EXISTS badge TEXT NOT NULL DEFAULT ''`;
  // Domaine DNS GoldenOTT à assigner (NULL = domaine par défaut du compte).
  await raw`ALTER TABLE iptv_offers ADD COLUMN IF NOT EXISTS dns_domain_id INTEGER`;

  // Commandes clients : demande d'un abonnement (nouveau ou renouvellement).
  // L'admin les valide → provisioning GoldenOTT → rattachement au compte.
  await raw`
    CREATE TABLE IF NOT EXISTS iptv_orders (
      id              SERIAL PRIMARY KEY,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      offer_id        INTEGER REFERENCES iptv_offers(id) ON DELETE SET NULL,
      kind            TEXT NOT NULL DEFAULT 'line',
      title           TEXT NOT NULL DEFAULT 'Abonnement',
      price_cents     INTEGER NOT NULL DEFAULT 0,
      package_id      INTEGER NOT NULL,
      template_id     INTEGER,
      max_connections SMALLINT,
      is_adult        BOOLEAN NOT NULL DEFAULT false,
      mac             TEXT,
      renew_sub_id    INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
      status          TEXT NOT NULL DEFAULT 'pending',
      subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
      customer_note   TEXT NOT NULL DEFAULT '',
      admin_note      TEXT NOT NULL DEFAULT '',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      decided_at      TIMESTAMPTZ
    )
  `;
  await raw`CREATE INDEX IF NOT EXISTS idx_orders_status ON iptv_orders (status, created_at DESC)`;
  await raw`CREATE INDEX IF NOT EXISTS idx_orders_user ON iptv_orders (user_id)`;
  await raw`ALTER TABLE iptv_orders ADD COLUMN IF NOT EXISTS dns_domain_id INTEGER`;

  // Journal d'audit : chaque appel sensible vers GoldenOTT (création,
  // prolongation, remboursement, sync) y est tracé, succès comme échec.
  await raw`
    CREATE TABLE IF NOT EXISTS goldenott_events (
      id              SERIAL PRIMARY KEY,
      actor           TEXT NOT NULL DEFAULT 'system',
      action          TEXT NOT NULL,
      kind            TEXT,
      provider_ref    TEXT,
      subscription_id INTEGER,
      ok              BOOLEAN NOT NULL DEFAULT true,
      message         TEXT NOT NULL DEFAULT '',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await raw`CREATE INDEX IF NOT EXISTS idx_gevents_created ON goldenott_events (created_at DESC)`;

  /* ---------- Portail MAC (app NexoraTV) ---------- */

  // Playlists M3U assignées à une adresse MAC (portail à la MAG) : l'app
  // interroge /api/playlist?mac=... et charge la playlist correspondante
  // sans jamais exposer l'URL M3U au client.
  await raw`
    CREATE TABLE IF NOT EXISTS device_playlists (
      id         SERIAL PRIMARY KEY,
      mac        TEXT NOT NULL UNIQUE,
      name       TEXT NOT NULL DEFAULT 'Playlist',
      m3u_url    TEXT NOT NULL,
      epg_url    TEXT,
      note       TEXT NOT NULL DEFAULT '',
      active     BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await raw`CREATE INDEX IF NOT EXISTS idx_device_playlists_mac ON device_playlists (mac)`;

  await raw`
    INSERT INTO app_meta (key, value)
    VALUES ('schema_version', ${String(SCHEMA_VERSION)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

async function ensureSchema(): Promise<void> {
  const raw = connection();

  const check = await raw`SELECT to_regclass('public.subscriptions') AS t`;
  if (check[0]?.t) {
    // Base déjà en place : on ne rejoue les migrations que si nécessaire.
    if ((await readSchemaVersion(raw)) >= SCHEMA_VERSION) return;
    await ensureMigrations(raw);
    return;
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
      screens      SMALLINT,
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
