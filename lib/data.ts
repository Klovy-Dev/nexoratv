import "server-only";
import { sql } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
import { isExpired } from "@/lib/validation";
import type { Subscription, SubscriptionView, User } from "@/lib/types";

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

export async function userById(id: number): Promise<User | null> {
  const rows = (await sql`
    SELECT id, name, email, role, created_at FROM users WHERE id = ${id}
  `) as unknown as User[];
  return rows[0] ?? null;
}

export async function adminStats() {
  const rows = (await sql`
    SELECT
      (SELECT COUNT(*) FROM users)::int                                   AS total_users,
      (SELECT COUNT(*) FROM users WHERE role = 'client')::int             AS total_clients,
      (SELECT COUNT(*) FROM subscriptions)::int                           AS total_subs,
      (SELECT COUNT(*) FROM subscriptions WHERE status = 'active')::int   AS active_subs
  `) as unknown as {
    total_users: number;
    total_clients: number;
    total_subs: number;
    active_subs: number;
  }[];
  return rows[0];
}
