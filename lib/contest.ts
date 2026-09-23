import "server-only";
import { sql } from "@/lib/db";
import type { GoldenottCatalog } from "@/lib/goldenott-catalog";

/**
 * Concours de parrainage : chaque client partage un lien concours (distinct
 * du lien de parrainage, sans crédit). Un filleul compte s'il s'inscrit avec
 * ce lien PENDANT le concours et y paie une première offre d'au moins
 * `minDurationDays` jours. Classement : nombre de filleuls validés, puis le
 * premier à avoir atteint ce score. Seuls ceux qui ont au moins
 * `minReferrals` filleuls peuvent gagner.
 *
 * Pour un prochain concours : modifier cette constante (dates, lots…).
 */
export const CONTEST = {
  title: "Concours de parrainage d'octobre",
  /** début inclus / fin exclue (heure de Paris) */
  startsAt: "2026-10-01T00:00:00+02:00",
  endsAt: "2026-11-01T00:00:00+01:00",
  startLabel: "1er octobre 2026",
  endLabel: "31 octobre 2026 à 23 h 59",
  minReferrals: 3,
  minDurationDays: 90,
  prizes: [
    "Infinity Max — 3 ans offerts",
    "Infinity — 1 an offert",
    "Plus — 3 mois offerts",
  ],
  /** le classement final reste affiché aux clients pendant ce nombre de jours */
  resultsVisibleDays: 14,
} as const;

export type ContestPhase = "upcoming" | "active" | "ended" | "archived";

export function contestPhase(now = new Date()): ContestPhase {
  const start = new Date(CONTEST.startsAt).getTime();
  const end = new Date(CONTEST.endsAt).getTime();
  const t = now.getTime();
  if (t < start) return "upcoming";
  if (t < end) return "active";
  if (t < end + CONTEST.resultsVisibleDays * 86_400_000) return "ended";
  return "archived";
}

/** Code concours d'un compte, dérivé de son id (ex. 42 → « CX2A »). */
export function contestCode(userId: number): string {
  return `CX${userId.toString(16).toUpperCase()}`;
}

/** Compte correspondant à un code concours, s'il existe (client uniquement). */
export async function userIdByContestCode(code: string): Promise<number | null> {
  const m = code.trim().toUpperCase().match(/^CX([0-9A-F]{1,8})$/);
  if (!m) return null;
  const id = parseInt(m[1], 16);
  const rows = (await sql`
    SELECT id FROM users WHERE id = ${id} AND role = 'client'
  `) as unknown as { id: number }[];
  return rows[0]?.id ?? null;
}

/** « Karim Benali » → « Karim B. » */
export function maskName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Client";
  const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  return parts[1] ? `${first} ${parts[1].charAt(0).toUpperCase()}.` : first;
}

/** Forfaits GoldenOTT qui qualifient une commande (payants, ≥ minDurationDays). */
export function qualifyingPackageIds(catalog: GoldenottCatalog): number[] {
  return catalog.packages
    .filter(
      (p) =>
        !p.isTrial &&
        !p.isPaidTrial &&
        p.durationDays != null &&
        p.durationDays >= CONTEST.minDurationDays,
    )
    .map((p) => p.id);
}

export interface ContestReferral {
  userId: number;
  name: string;
  email: string;
  signedUpAt: string;
  /** commande qualifiante (null = inscrit mais pas encore validé) */
  qualifiedAt: string | null;
  orderTitle: string | null;
}

export interface ContestParticipant {
  userId: number;
  name: string;
  email: string;
  score: number;
  /** date à laquelle le score actuel a été atteint (départage) */
  reachedAt: string | null;
  /** rang parmi ceux qui ont au moins un filleul validé */
  rank: number;
  eligible: boolean;
  /** lot remporté (ou en passe de l'être) */
  prize: string | null;
  referrals: ContestReferral[];
}

/**
 * Classement complet (admin). `packageIds` = qualifyingPackageIds(catalog).
 * Une commande remboursée (abonnement suspendu) ne compte pas.
 */
export async function contestLeaderboard(packageIds: number[]): Promise<ContestParticipant[]> {
  const rows = (await sql`
    SELECT
      r.id AS referrer_id, r.name AS referrer_name, r.email AS referrer_email,
      f.id AS user_id, f.name, f.email, f.created_at AS signed_up_at,
      q.paid_at AS qualified_at, q.title AS order_title
    FROM users f
    JOIN users r ON r.id = f.contest_referred_by
    LEFT JOIN LATERAL (
      SELECT o.paid_at, o.title
      FROM iptv_orders o
      LEFT JOIN subscriptions s ON s.id = o.subscription_id
      WHERE o.user_id = f.id
        AND o.status = 'fulfilled'
        AND o.paid_at IS NOT NULL
        AND o.paid_at >= ${CONTEST.startsAt}::timestamptz
        AND o.paid_at <  ${CONTEST.endsAt}::timestamptz
        AND o.price_cents > 0
        AND o.renew_sub_id IS NULL
        AND o.package_id = ANY(${packageIds})
        AND (s.id IS NULL OR s.status = 'active')
      ORDER BY o.paid_at ASC
      LIMIT 1
    ) q ON true
    WHERE f.created_at >= ${CONTEST.startsAt}::timestamptz
      AND f.created_at <  ${CONTEST.endsAt}::timestamptz
      AND f.role = 'client'
    ORDER BY r.id, q.paid_at ASC NULLS LAST, f.created_at ASC
  `) as unknown as {
    referrer_id: number;
    referrer_name: string;
    referrer_email: string;
    user_id: number;
    name: string;
    email: string;
    signed_up_at: string | Date;
    qualified_at: string | Date | null;
    order_title: string | null;
  }[];

  const byReferrer = new Map<number, ContestParticipant>();
  for (const r of rows) {
    let p = byReferrer.get(r.referrer_id);
    if (!p) {
      p = {
        userId: r.referrer_id,
        name: r.referrer_name,
        email: r.referrer_email,
        score: 0,
        reachedAt: null,
        rank: 0,
        eligible: false,
        prize: null,
        referrals: [],
      };
      byReferrer.set(r.referrer_id, p);
    }
    p.referrals.push({
      userId: r.user_id,
      name: r.name,
      email: r.email,
      signedUpAt: toIso(r.signed_up_at),
      qualifiedAt: r.qualified_at ? toIso(r.qualified_at) : null,
      orderTitle: r.order_title,
    });
    if (r.qualified_at) {
      p.score++;
      p.reachedAt = toIso(r.qualified_at); // lignes triées par date de validation
    }
  }

  const time = (iso: string | null) => (iso ? new Date(iso).getTime() : Infinity);
  const list = [...byReferrer.values()].sort(
    (a, b) => b.score - a.score || time(a.reachedAt) - time(b.reachedAt),
  );

  let rank = 0;
  let prizeIndex = 0;
  for (const p of list) {
    if (p.score > 0) p.rank = ++rank;
    p.eligible = p.score >= CONTEST.minReferrals;
    if (p.eligible && prizeIndex < CONTEST.prizes.length) {
      p.prize = CONTEST.prizes[prizeIndex++];
    }
  }
  return list;
}

function toIso(v: string | Date): string {
  return v instanceof Date ? v.toISOString() : String(v);
}
