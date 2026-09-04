import "server-only";
import { sql } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
import { isExpired } from "@/lib/validation";
import type {
  DevicePlaylist,
  Offer,
  Order,
  OrderView,
  ProviderKind,
  Review,
  ReviewStats,
  Subscription,
  SubscriptionView,
  User,
} from "@/lib/types";

/* ---------- Abonnements ---------- */

export async function subscriptionsForUser(
  userId: number,
): Promise<SubscriptionView[]> {
  const rows = (await sql`
    SELECT * FROM subscriptions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `) as unknown as Subscription[];

  return rows.map(toView);
}

export async function subscriptionById(
  id: number,
): Promise<SubscriptionView | null> {
  const rows = (await sql`
    SELECT * FROM subscriptions WHERE id = ${id}
  `) as unknown as Subscription[];
  return rows[0] ? toView(rows[0]) : null;
}

function toDateString(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function toView(row: Subscription): SubscriptionView {
  const { password_enc, ...rest } = row;
  const expires = toDateString(row.expires_at);
  return {
    ...rest,
    expires_at: expires,
    synced_at: row.synced_at ? new Date(row.synced_at).toISOString() : null,
    password: decryptSecret(password_enc),
    expired: isExpired(expires),
  };
}

/* ---------- Utilisateurs (admin) ---------- */

export interface UserRow extends User {
  sub_count: number;
}

export async function allUsers(): Promise<UserRow[]> {
  return (await sql`
    SELECT u.id, u.name, u.email, u.role, u.created_at,
           (SELECT COUNT(*) FROM subscriptions s WHERE s.user_id = u.id)::int AS sub_count
    FROM users u
    ORDER BY u.created_at DESC
  `) as unknown as UserRow[];
}

/**
 * Adresse de notification de l'équipe : `ORDER_NOTIFY_EMAIL` si défini,
 * sinon l'e-mail du plus ancien compte administrateur.
 */
export async function notifyEmail(): Promise<string | null> {
  const override = process.env.ORDER_NOTIFY_EMAIL?.trim();
  if (override) return override;
  const rows = (await sql`
    SELECT email FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1
  `) as unknown as { email: string }[];
  return rows[0]?.email ?? null;
}

export async function userById(id: number): Promise<User | null> {
  const rows = (await sql`
    SELECT id, name, email, role, created_at FROM users WHERE id = ${id}
  `) as unknown as User[];
  return rows[0] ?? null;
}

/* ---------- Avis ---------- */

export async function listReviews(): Promise<Review[]> {
  return (await sql`
    SELECT r.id, r.user_id, r.rating, r.body, r.created_at, u.name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    ORDER BY r.created_at DESC
  `) as unknown as Review[];
}

export async function reviewStats(): Promise<ReviewStats> {
  const rows = (await sql`
    SELECT rating, COUNT(*)::int AS n FROM reviews GROUP BY rating
  `) as unknown as { rating: 1 | 2 | 3 | 4 | 5; n: number }[];

  const distribution: ReviewStats["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let count = 0;
  let sum = 0;
  for (const row of rows) {
    distribution[row.rating] = row.n;
    count += row.n;
    sum += row.rating * row.n;
  }
  return { count, average: count > 0 ? sum / count : 0, distribution };
}

export async function reviewByUser(userId: number): Promise<Review | null> {
  const rows = (await sql`
    SELECT r.id, r.user_id, r.rating, r.body, r.created_at, u.name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.user_id = ${userId}
  `) as unknown as Review[];
  return rows[0] ?? null;
}

/* ---------- Portail MAC (app NexoraTV) ---------- */

export async function listDevicePlaylists(): Promise<DevicePlaylist[]> {
  return (await sql`
    SELECT * FROM device_playlists ORDER BY created_at DESC
  `) as unknown as DevicePlaylist[];
}

export async function devicePlaylistByMac(
  mac: string,
): Promise<DevicePlaylist | null> {
  const rows = (await sql`
    SELECT * FROM device_playlists WHERE mac = ${mac} AND active = true
  `) as unknown as DevicePlaylist[];
  return rows[0] ?? null;
}

export async function devicePlaylistById(
  id: number,
): Promise<DevicePlaylist | null> {
  const rows = (await sql`
    SELECT * FROM device_playlists WHERE id = ${id}
  `) as unknown as DevicePlaylist[];
  return rows[0] ?? null;
}

export async function adminStats() {
  const rows = (await sql`
    SELECT
      (SELECT COUNT(*) FROM users)::int                                   AS total_users,
      (SELECT COUNT(*) FROM users WHERE role = 'client')::int             AS total_clients,
      (SELECT COUNT(*) FROM subscriptions)::int                           AS total_subs,
      (SELECT COUNT(*) FROM subscriptions WHERE status = 'active')::int   AS active_subs,
      (SELECT COUNT(*) FROM iptv_orders WHERE status = 'pending')::int     AS pending_orders
  `) as unknown as {
    total_users: number;
    total_clients: number;
    total_subs: number;
    active_subs: number;
    pending_orders: number;
  }[];
  return rows[0];
}

/* ---------- Offres (self-service) ---------- */

export async function listOffers(activeOnly = false): Promise<Offer[]> {
  const rows = activeOnly
    ? ((await sql`
        SELECT * FROM iptv_offers WHERE active = true
        ORDER BY sort ASC, price_cents ASC, id ASC
      `) as unknown as Offer[])
    : ((await sql`
        SELECT * FROM iptv_offers
        ORDER BY sort ASC, price_cents ASC, id ASC
      `) as unknown as Offer[]);
  return rows;
}

export async function offerById(id: number): Promise<Offer | null> {
  const rows = (await sql`
    SELECT * FROM iptv_offers WHERE id = ${id}
  `) as unknown as Offer[];
  return rows[0] ?? null;
}

/* ---------- Commandes (self-service) ---------- */

export async function ordersForUser(userId: number): Promise<Order[]> {
  return (await sql`
    SELECT * FROM iptv_orders WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `) as unknown as Order[];
}

export async function allOrders(statusFilter?: string): Promise<OrderView[]> {
  if (statusFilter) {
    return (await sql`
      SELECT o.*, u.name AS user_name, u.email AS user_email
      FROM iptv_orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.status = ${statusFilter}
      ORDER BY o.created_at DESC
    `) as unknown as OrderView[];
  }
  return (await sql`
    SELECT o.*, u.name AS user_name, u.email AS user_email
    FROM iptv_orders o
    JOIN users u ON u.id = o.user_id
    ORDER BY
      CASE o.status WHEN 'pending' THEN 0 ELSE 1 END,
      o.created_at DESC
  `) as unknown as OrderView[];
}

export async function orderById(id: number): Promise<OrderView | null> {
  const rows = (await sql`
    SELECT o.*, u.name AS user_name, u.email AS user_email
    FROM iptv_orders o
    JOIN users u ON u.id = o.user_id
    WHERE o.id = ${id}
  `) as unknown as OrderView[];
  return rows[0] ?? null;
}

export async function pendingOrdersCount(): Promise<number> {
  const rows = (await sql`
    SELECT COUNT(*)::int AS n FROM iptv_orders WHERE status = 'pending'
  `) as unknown as { n: number }[];
  return rows[0]?.n ?? 0;
}

/* ---------- Journal GoldenOTT ---------- */

export interface GoldenottEvent {
  id: number;
  actor: string;
  action: string;
  kind: ProviderKind | null;
  provider_ref: string | null;
  subscription_id: number | null;
  ok: boolean;
  message: string;
  created_at: string;
}

export async function recentGoldenottEvents(limit = 30): Promise<GoldenottEvent[]> {
  return (await sql`
    SELECT * FROM goldenott_events
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as unknown as GoldenottEvent[];
}

export async function logGoldenottEvent(e: {
  actor: string;
  action: string;
  kind?: ProviderKind | null;
  providerRef?: string | null;
  subscriptionId?: number | null;
  ok: boolean;
  message?: string;
}): Promise<void> {
  try {
    await sql`
      INSERT INTO goldenott_events
        (actor, action, kind, provider_ref, subscription_id, ok, message)
      VALUES
        (${e.actor}, ${e.action}, ${e.kind ?? null}, ${e.providerRef ?? null},
         ${e.subscriptionId ?? null}, ${e.ok}, ${(e.message ?? "").slice(0, 500)})
    `;
  } catch {
    /* le journal ne doit jamais faire échouer l'action principale */
  }
}
