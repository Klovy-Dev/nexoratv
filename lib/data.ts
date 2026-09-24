import "server-only";
import { sql } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
import { isExpired } from "@/lib/validation";
import type {
  AccountingSummary,
  CreditPurchase,
  DevicePlaylist,
  Expense,
  TutoSection,
  Offer,
  Order,
  OrderView,
  ProviderKind,
  ReferralInfo,
  ReferralReward,
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
  /** date du dernier abonnement rattaché (null si aucun) */
  last_sub_at: string | null;
}

/**
 * Clients triés du plus récemment « servi » au plus ancien : on prend la
 * date du dernier abonnement rattaché, et à défaut la date d'inscription.
 * Le client qui vient de prendre un abonnement remonte donc en tête.
 */
export async function allUsers(): Promise<UserRow[]> {
  return (await sql`
    SELECT u.id, u.name, u.email, u.role, u.created_at,
           (SELECT COUNT(*) FROM subscriptions s WHERE s.user_id = u.id)::int AS sub_count,
           (SELECT MAX(s.created_at) FROM subscriptions s WHERE s.user_id = u.id) AS last_sub_at
    FROM users u
    ORDER BY
      COALESCE(
        (SELECT MAX(s.created_at) FROM subscriptions s WHERE s.user_id = u.id),
        u.created_at
      ) DESC
  `) as unknown as UserRow[];
}

/**
 * Nettoyage automatique, best-effort, appelé au chargement des pages admin
 * et profil (et par le cron) :
 *   - les commandes refusées sont supprimées (le refus est notifié par
 *     e-mail, on ne garde pas d'historique) ;
 *   - les abonnements d'essai 24 h sont supprimés dès qu'ils expirent.
 * `trialPackageIds` (forfaits d'essai du catalogue GoldenOTT) permet de
 * rattraper les essais enregistrés à tort comme abonnements normaux.
 */
export async function purgeExpiredTrialsAndRejected(
  trialPackageIds: number[] = [],
): Promise<void> {
  try {
    if (trialPackageIds.length > 0) {
      await sql`
        UPDATE subscriptions SET is_trial = true
        WHERE is_trial = false AND provider = 'goldenott'
          AND package_id = ANY(${trialPackageIds})
      `;
    }
    await sql`DELETE FROM iptv_orders WHERE status = 'rejected'`;
    // Sessions Stripe abandonnées (client reparti sans payer) : on libère
    // l'offre après 2 h pour ne pas bloquer une nouvelle tentative. Le crédit
    // de parrainage réservé dessus doit d'abord être restitué au client.
    const abandoned = (await sql`
      SELECT user_id, credit_applied_cents FROM iptv_orders
      WHERE status = 'awaiting_payment' AND created_at < now() - interval '2 hours'
        AND credit_applied_cents > 0
    `) as unknown as { user_id: number; credit_applied_cents: number }[];
    for (const o of abandoned) {
      await releaseReferralCredit(o.user_id, o.credit_applied_cents);
    }
    await sql`
      DELETE FROM iptv_orders
      WHERE status = 'awaiting_payment' AND created_at < now() - interval '2 hours'
    `;
    // expires_at n'a qu'une précision au jour : un essai 24 h expire le
    // lendemain de sa création. On le purge dès ce jour-là, une fois ses
    // 24 h écoulées, sans attendre le surlendemain.
    await sql`
      DELETE FROM subscriptions
      WHERE is_trial = true
        AND expires_at IS NOT NULL
        AND (
          expires_at < CURRENT_DATE
          OR (expires_at = CURRENT_DATE AND created_at < now() - interval '24 hours')
        )
    `;
  } catch {
    /* le nettoyage ne doit jamais bloquer l'affichage */
  }
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

/* ---------- Page Tuto ---------- */

export async function listTutoSections(): Promise<TutoSection[]> {
  return (await sql`
    SELECT * FROM tuto_sections ORDER BY sort, id
  `) as unknown as TutoSection[];
}

export async function listPublishedTutoSections(): Promise<TutoSection[]> {
  return (await sql`
    SELECT * FROM tuto_sections WHERE published = true ORDER BY sort, id
  `) as unknown as TutoSection[];
}

export async function tutoSectionById(
  id: number,
): Promise<TutoSection | null> {
  const rows = (await sql`
    SELECT * FROM tuto_sections WHERE id = ${id}
  `) as unknown as TutoSection[];
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

/**
 * Le client a-t-il déjà profité d'un forfait d'essai ? (commande en attente
 * ou honorée sur un forfait d'essai, ou abonnement d'essai encore présent).
 * Sert à n'autoriser l'essai qu'une seule fois par compte.
 */
export async function hasUsedTrial(
  userId: number,
  trialPackageIds: number[],
): Promise<boolean> {
  const trialSub = (await sql`
    SELECT 1 FROM subscriptions
    WHERE user_id = ${userId} AND is_trial = true
    LIMIT 1
  `) as unknown as unknown[];
  if (trialSub.length > 0) return true;

  if (trialPackageIds.length === 0) return false;
  const order = (await sql`
    SELECT 1 FROM iptv_orders
    WHERE user_id = ${userId}
      AND status IN ('awaiting_payment', 'pending', 'fulfilled')
      AND package_id = ANY(${trialPackageIds})
    LIMIT 1
  `) as unknown as unknown[];
  return order.length > 0;
}

/**
 * Cette IP a-t-elle déjà profité d'un essai gratuit (sur n'importe quel
 * compte) ? Sert à bloquer les comptes créés uniquement pour rejouer
 * l'essai 24h depuis la même connexion.
 */
export async function trialBlockedForIp(ip: string): Promise<boolean> {
  const rows = (await sql`
    SELECT 1 FROM trial_ip_blocks WHERE ip = ${ip} LIMIT 1
  `) as unknown as unknown[];
  return rows.length > 0;
}

/**
 * Marque cette IP comme ayant consommé un essai gratuit (appelé une fois la
 * commande d'essai validée). Idempotent : ne touche pas au premier blocage
 * déjà enregistré si l'IP est rejouée.
 */
export async function markTrialUsedByIp(ip: string, orderId: number): Promise<void> {
  await sql`
    INSERT INTO trial_ip_blocks (ip, first_order_id)
    VALUES (${ip}, ${orderId})
    ON CONFLICT (ip) DO NOTHING
  `;
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

/* ---------- Abonnements qui expirent bientôt (tous clients) ---------- */

export interface UpcomingExpirySubscription {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  label: string;
  expires_at: string;
  status: "active" | "suspended";
}

/**
 * Abonnements actifs dont l'échéance tombe dans les `days` prochains jours
 * (inclut ceux déjà expirés mais encore marqués actifs — les plus urgents à
 * relancer), tous clients confondus, triés du plus proche au plus lointain.
 */
export async function subscriptionsExpiringSoon(
  days = 14,
): Promise<UpcomingExpirySubscription[]> {
  return (await sql`
    SELECT s.id, s.user_id, u.name AS user_name, u.email AS user_email,
           s.label, s.expires_at::date AS expires_at, s.status
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE s.status = 'active'
      AND s.expires_at IS NOT NULL
      AND s.expires_at <= (CURRENT_DATE + ${days}::int)
    ORDER BY s.expires_at ASC
  `) as unknown as UpcomingExpirySubscription[];
}

/* ---------- Rappels d'échéance par e-mail ---------- */

/**
 * Deux rappels par échéance : `j5` (reste 2 à 5 jours) et `j1` (reste 0 à
 * 1 jour). Les fenêtres couvrent un cron manqué ou un abonnement créé avec
 * moins de 5 jours restants.
 */
export type ExpiryReminderKind = "j5" | "j1";

const REMINDER_WINDOW: Record<ExpiryReminderKind, [number, number]> = {
  j5: [2, 5],
  j1: [0, 1],
};

export interface ExpiryReminderTarget {
  subscriptionId: number;
  userName: string;
  userEmail: string;
  label: string;
  expiresAt: string;
  daysLeft: number;
}

/**
 * Abonnements payants actifs dans la fenêtre du rappel `kind`, pas encore
 * rappelés pour cette échéance, et sans renouvellement payé en attente.
 */
export async function subscriptionsDueForExpiryReminder(
  kind: ExpiryReminderKind,
): Promise<ExpiryReminderTarget[]> {
  const [min, max] = REMINDER_WINDOW[kind];
  const rows = (await sql`
    SELECT s.id, u.name, u.email, s.label, s.expires_at,
           (s.expires_at::date - CURRENT_DATE)::int AS days_left
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE s.status = 'active'
      AND s.is_trial = false
      AND s.expires_at IS NOT NULL
      AND s.expires_at::date BETWEEN CURRENT_DATE + ${min}::int AND CURRENT_DATE + ${max}::int
      AND NOT EXISTS (
        SELECT 1 FROM expiry_reminders r
        WHERE r.subscription_id = s.id
          AND r.expires_at = s.expires_at::date
          AND r.kind = ${kind}
      )
      AND NOT EXISTS (
        SELECT 1 FROM iptv_orders o
        WHERE o.renew_sub_id = s.id AND o.status = 'pending'
      )
    ORDER BY s.expires_at ASC
  `) as unknown as {
    id: number;
    name: string;
    email: string;
    label: string;
    expires_at: unknown;
    days_left: number;
  }[];

  return rows.map((r) => ({
    subscriptionId: r.id,
    userName: r.name,
    userEmail: r.email,
    label: r.label,
    expiresAt: toDateString(r.expires_at) ?? String(r.expires_at),
    daysLeft: r.days_left,
  }));
}

/**
 * Réserve l'envoi d'un rappel. Renvoie `false` si déjà réservé (exécution
 * concurrente) : dans ce cas, ne rien envoyer.
 */
export async function claimExpiryReminder(
  subscriptionId: number,
  expiresAt: string,
  kind: ExpiryReminderKind,
): Promise<boolean> {
  const rows = await sql`
    INSERT INTO expiry_reminders (subscription_id, expires_at, kind)
    VALUES (${subscriptionId}, ${expiresAt}::date, ${kind})
    ON CONFLICT DO NOTHING
    RETURNING subscription_id
  `;
  return rows.length > 0;
}

/** Annule une réservation (envoi échoué) pour réessayer au prochain cron. */
export async function releaseExpiryReminder(
  subscriptionId: number,
  expiresAt: string,
  kind: ExpiryReminderKind,
): Promise<void> {
  await sql`
    DELETE FROM expiry_reminders
    WHERE subscription_id = ${subscriptionId}
      AND expires_at = ${expiresAt}::date
      AND kind = ${kind}
  `;
}

/* ---------- Parrainage ---------- */

/** Récompense créditée au parrain à la première commande payée d'un filleul. */
export const REFERRAL_REWARD_CENTS = 500;

/** Un client règle toujours au moins 1 € par carte, même crédit épuisé. */
const REFERRAL_MIN_PAYABLE_CENTS = 100;

export async function referralInfo(userId: number): Promise<ReferralInfo | null> {
  const rows = (await sql`
    SELECT referral_code AS code, referral_balance_cents AS balance_cents
    FROM users WHERE id = ${userId}
  `) as unknown as ReferralInfo[];
  return rows[0] ?? null;
}

export async function userIdByReferralCode(code: string): Promise<number | null> {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  const rows = (await sql`
    SELECT id FROM users WHERE referral_code = ${clean}
  `) as unknown as { id: number }[];
  return rows[0]?.id ?? null;
}

export async function referralRewardsForUser(referrerId: number): Promise<ReferralReward[]> {
  return (await sql`
    SELECT r.id, r.cents, r.created_at, u.name AS referred_name
    FROM referral_rewards r
    JOIN users u ON u.id = r.referred_user_id
    WHERE r.referrer_id = ${referrerId}
    ORDER BY r.created_at DESC
  `) as unknown as ReferralReward[];
}

/**
 * Réserve sur une commande jusqu'au solde de crédit parrainage disponible
 * (au moins 1 € reste toujours à régler par carte, minimum imposé par
 * Stripe) et décrémente le solde du client d'autant. Renvoie le montant
 * réservé, en centimes.
 */
export async function reserveReferralCredit(
  userId: number,
  priceCents: number,
): Promise<number> {
  const maxUsable = Math.max(0, priceCents - REFERRAL_MIN_PAYABLE_CENTS);
  if (maxUsable <= 0) return 0;

  const rows = (await sql`
    SELECT referral_balance_cents FROM users WHERE id = ${userId}
  `) as unknown as { referral_balance_cents: number }[];
  const applied = Math.min(rows[0]?.referral_balance_cents ?? 0, maxUsable);
  if (applied <= 0) return 0;

  await sql`
    UPDATE users SET referral_balance_cents = referral_balance_cents - ${applied}
    WHERE id = ${userId}
  `;
  return applied;
}

/** Restitue un crédit réservé (commande annulée, refusée ou abandonnée). */
export async function releaseReferralCredit(
  userId: number,
  cents: number,
): Promise<void> {
  if (cents <= 0) return;
  await sql`
    UPDATE users SET referral_balance_cents = referral_balance_cents + ${cents}
    WHERE id = ${userId}
  `;
}

/**
 * Récompense le parrain d'un client à sa toute première commande payée —
 * jamais sur un renouvellement, ni sur un forfait d'essai gratuit, ni sur
 * une offre de moins d'un an (`oneYearOrMore`, calculé par l'appelant à
 * partir du catalogue GoldenOTT). Sans effet si ce filleul a déjà généré
 * une récompense (index unique sur `referred_user_id`, vérifié en base
 * pour éviter toute course).
 */
export async function grantReferralReward(
  order: {
    id: number;
    user_id: number;
    price_cents: number;
  },
  oneYearOrMore: boolean,
): Promise<void> {
  if (order.price_cents <= 0) return;
  if (!oneYearOrMore) return;

  const rows = (await sql`
    SELECT referred_by FROM users WHERE id = ${order.user_id}
  `) as unknown as { referred_by: number | null }[];
  const referrerId = rows[0]?.referred_by;
  if (!referrerId) return;

  const inserted = (await sql`
    INSERT INTO referral_rewards (referrer_id, referred_user_id, order_id, cents)
    VALUES (${referrerId}, ${order.user_id}, ${order.id}, ${REFERRAL_REWARD_CENTS})
    ON CONFLICT (referred_user_id) DO NOTHING
    RETURNING id
  `) as unknown as { id: number }[];
  if (inserted.length === 0) return;

  await sql`
    UPDATE users SET referral_balance_cents = referral_balance_cents + ${REFERRAL_REWARD_CENTS}
    WHERE id = ${referrerId}
  `;
}

/* ---------- Compte Discord lié ---------- */

export async function discordIdForUser(userId: number): Promise<string | null> {
  const rows = (await sql`
    SELECT discord_id FROM users WHERE id = ${userId}
  `) as unknown as { discord_id: string | null }[];
  return rows[0]?.discord_id ?? null;
}

/** A-t-il déjà confirmé avoir rejoint Discord/Telegram (cf. /rejoindre) ? */
export async function hasJoinedCommunity(userId: number): Promise<boolean> {
  const rows = (await sql`
    SELECT community_joined_at FROM users WHERE id = ${userId}
  `) as unknown as { community_joined_at: string | null }[];
  return rows[0]?.community_joined_at != null;
}

/** @returns false si ce compte Discord est déjà relié à un autre utilisateur. */
export async function setDiscordId(
  userId: number,
  discordId: string,
): Promise<boolean> {
  try {
    await sql`UPDATE users SET discord_id = ${discordId} WHERE id = ${userId}`;
    return true;
  } catch {
    return false; // conflit sur l'index unique (déjà relié ailleurs)
  }
}

export async function clearDiscordId(userId: number): Promise<void> {
  await sql`UPDATE users SET discord_id = NULL WHERE id = ${userId}`;
}

export type DiscordRoleStatus = "active" | "trial" | "none";

/**
 * Pour chaque client ayant relié son compte Discord : le rôle qui
 * correspond à son abonnement actuel. Consommé par le bot Discord
 * (cf. /api/discord/roles) pour synchroniser les rôles du serveur.
 */
export async function discordRoleStatuses(): Promise<
  { discordId: string; status: DiscordRoleStatus }[]
> {
  const rows = (await sql`
    SELECT u.discord_id, s.status, s.is_trial, s.expires_at
    FROM users u
    JOIN subscriptions s ON s.user_id = u.id
    WHERE u.discord_id IS NOT NULL
  `) as unknown as {
    discord_id: string;
    status: "active" | "suspended";
    is_trial: boolean;
    expires_at: string | null;
  }[];

  const byUser = new Map<string, DiscordRoleStatus>();
  for (const row of rows) {
    if (row.status !== "active" || isExpired(row.expires_at)) continue;
    const current = byUser.get(row.discord_id);
    const next: DiscordRoleStatus = row.is_trial ? "trial" : "active";
    // "active" (abonnement payant) prime sur "trial" si le client a les deux.
    if (!current || next === "active") byUser.set(row.discord_id, next);
  }

  return [...byUser.entries()].map(([discordId, status]) => ({ discordId, status }));
}

/** Résumé d'abonnement pour affichage Discord (jamais le mot de passe). */
export interface DiscordSubscriptionSummary {
  label: string;
  status: "active" | "suspended";
  isTrial: boolean;
  expiresAt: string | null;
  expired: boolean;
}

/** @returns null si aucun compte NexoraTV n'est relié à ce Discord ID. */
export async function subscriptionsForDiscordId(
  discordId: string,
): Promise<DiscordSubscriptionSummary[] | null> {
  const users = (await sql`
    SELECT id FROM users WHERE discord_id = ${discordId}
  `) as unknown as { id: number }[];
  if (!users[0]) return null;

  const rows = (await sql`
    SELECT label, status, is_trial, expires_at FROM subscriptions
    WHERE user_id = ${users[0].id}
    ORDER BY created_at DESC
  `) as unknown as { label: string; status: "active" | "suspended"; is_trial: boolean; expires_at: string | null }[];

  return rows.map((r) => ({
    label: r.label,
    status: r.status,
    isTrial: r.is_trial,
    expiresAt: toDateString(r.expires_at),
    expired: isExpired(toDateString(r.expires_at)),
  }));
}

export interface ExpiringSubscription {
  subscriptionId: number;
  discordId: string;
  label: string;
  expiresAt: string;
  daysLeft: number;
}

/**
 * Abonnements payants (hors essai) reliés à un compte Discord, qui expirent
 * dans exactement `days` jours. Consommé quotidiennement par le bot pour
 * envoyer un rappel — la déduplication (un seul rappel par abonnement) est
 * gérée côté bot, pas ici.
 */
export async function expiringSubscriptionsForReminder(
  days: number,
): Promise<ExpiringSubscription[]> {
  const rows = (await sql`
    SELECT s.id AS subscription_id, u.discord_id, s.label, s.expires_at
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE u.discord_id IS NOT NULL
      AND s.status = 'active'
      AND s.is_trial = false
      AND s.expires_at = CURRENT_DATE + ${days}::int
  `) as unknown as { subscription_id: number; discord_id: string; label: string; expires_at: string }[];

  return rows.map((r) => ({
    subscriptionId: r.subscription_id,
    discordId: r.discord_id,
    label: r.label,
    expiresAt: toDateString(r.expires_at) ?? r.expires_at,
    daysLeft: days,
  }));
}

/**
 * Essais (is_trial = true) reliés à un compte Discord qui se terminent
 * aujourd'hui — utilisé pour relancer vers un forfait payant.
 */
export async function expiringTrialsForReminder(): Promise<ExpiringSubscription[]> {
  const rows = (await sql`
    SELECT s.id AS subscription_id, u.discord_id, s.label, s.expires_at
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE u.discord_id IS NOT NULL
      AND s.status = 'active'
      AND s.is_trial = true
      AND s.expires_at = CURRENT_DATE
  `) as unknown as { subscription_id: number; discord_id: string; label: string; expires_at: string }[];

  return rows.map((r) => ({
    subscriptionId: r.subscription_id,
    discordId: r.discord_id,
    label: r.label,
    expiresAt: toDateString(r.expires_at) ?? r.expires_at,
    daysLeft: 0,
  }));
}

export interface DiscordStatsSnapshot {
  totalUsers: number;
  activeSubs: number;
  trialSubs: number;
  pendingOrders: number;
}

export async function discordStatsSnapshot(): Promise<DiscordStatsSnapshot> {
  const [users, subs, orders] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM users` as unknown as Promise<{ n: number }[]>,
    sql`
      SELECT
        COUNT(*) FILTER (WHERE is_trial = false)::int AS active,
        COUNT(*) FILTER (WHERE is_trial = true)::int AS trial
      FROM subscriptions
      WHERE status = 'active' AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
    ` as unknown as Promise<{ active: number; trial: number }[]>,
    sql`SELECT COUNT(*)::int AS n FROM iptv_orders WHERE status = 'pending'` as unknown as Promise<
      { n: number }[]
    >,
  ]);

  return {
    totalUsers: users[0]?.n ?? 0,
    activeSubs: subs[0]?.active ?? 0,
    trialSubs: subs[0]?.trial ?? 0,
    pendingOrders: orders[0]?.n ?? 0,
  };
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

/* ---------- Comptabilité ---------- */

// `credits` est NUMERIC en base : postgres.js le renvoie en string par
// défaut, d'où le cast explicite ::float8 (précision suffisante, ce n'est
// qu'une quantité de crédits, pas un montant en euros).
export async function listCreditPurchases(): Promise<CreditPurchase[]> {
  return (await sql`
    SELECT id, purchased_at, credits::float8 AS credits, total_price_cents, note, created_by, created_at
    FROM credit_purchases ORDER BY purchased_at DESC, id DESC
  `) as unknown as CreditPurchase[];
}

export async function creditPurchaseById(id: number): Promise<CreditPurchase | null> {
  const rows = (await sql`
    SELECT id, purchased_at, credits::float8 AS credits, total_price_cents, note, created_by, created_at
    FROM credit_purchases WHERE id = ${id}
  `) as unknown as CreditPurchase[];
  return rows[0] ?? null;
}

export async function listExpenses(): Promise<Expense[]> {
  return (await sql`
    SELECT * FROM expenses ORDER BY expense_date DESC, id DESC
  `) as unknown as Expense[];
}

export async function expenseById(id: number): Promise<Expense | null> {
  const rows = (await sql`
    SELECT * FROM expenses WHERE id = ${id}
  `) as unknown as Expense[];
  return rows[0] ?? null;
}

export async function creditPurchasesForPeriod(from: string, to: string): Promise<CreditPurchase[]> {
  return (await sql`
    SELECT id, purchased_at, credits::float8 AS credits, total_price_cents, note, created_by, created_at
    FROM credit_purchases WHERE purchased_at BETWEEN ${from} AND ${to} ORDER BY purchased_at
  `) as unknown as CreditPurchase[];
}

export async function expensesForPeriod(from: string, to: string): Promise<Expense[]> {
  return (await sql`
    SELECT * FROM expenses WHERE expense_date BETWEEN ${from} AND ${to} ORDER BY expense_date
  `) as unknown as Expense[];
}

/** Commandes honorées et payées sur la période — pour le détail de l'export comptable. */
export async function fulfilledOrdersForPeriod(
  from: string,
  to: string,
): Promise<{ id: number; title: string; price_cents: number; payment_provider: string; paid_at: string }[]> {
  return (await sql`
    SELECT id, title, price_cents, payment_provider, paid_at
    FROM iptv_orders
    WHERE status = 'fulfilled' AND paid_at IS NOT NULL AND paid_at::date BETWEEN ${from} AND ${to}
    ORDER BY paid_at
  `) as unknown as { id: number; title: string; price_cents: number; payment_provider: string; paid_at: string }[];
}

/**
 * CA / coûts / marge sur une période [from, to] (dates incluses).
 * Revenu = commandes honorées, sur leur date de paiement réelle (paid_at).
 * Coûts = achats de crédits fournisseur + dépenses diverses sur la période.
 */
export async function accountingSummary(from: string, to: string): Promise<AccountingSummary> {
  const [revenue, credits, expensesRow] = await Promise.all([
    sql`
      SELECT COUNT(*)::int AS n, COALESCE(SUM(price_cents), 0)::int AS cents
      FROM iptv_orders
      WHERE status = 'fulfilled'
        AND paid_at IS NOT NULL
        AND paid_at::date BETWEEN ${from} AND ${to}
    ` as unknown as Promise<{ n: number; cents: number }[]>,
    sql`
      SELECT COALESCE(SUM(total_price_cents), 0)::int AS cents
      FROM credit_purchases
      WHERE purchased_at BETWEEN ${from} AND ${to}
    ` as unknown as Promise<{ cents: number }[]>,
    sql`
      SELECT COALESCE(SUM(amount_cents), 0)::int AS cents
      FROM expenses
      WHERE expense_date BETWEEN ${from} AND ${to}
    ` as unknown as Promise<{ cents: number }[]>,
  ]);

  const revenueCents = revenue[0]?.cents ?? 0;
  const creditCostCents = credits[0]?.cents ?? 0;
  const expenseCents = expensesRow[0]?.cents ?? 0;
  const costCents = creditCostCents + expenseCents;

  return {
    revenueCents,
    creditCostCents,
    expenseCents,
    costCents,
    marginCents: revenueCents - costCents,
    orderCount: revenue[0]?.n ?? 0,
  };
}
