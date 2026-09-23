import "server-only";
import { sql } from "@/lib/db";

/* ---------- Dashboard admin ---------- */

/** Valeur sur les dernières 24 h, les 24 h d'avant (tendance), 7 j et 30 j. */
export interface DashboardMetric {
  last24h: number;
  prev24h: number;
  last7d: number;
  last30d: number;
}

export interface DashboardDay {
  /** AAAA-MM-JJ, jour calendaire à Paris */
  day: string;
  signups: number;
  visitors: number;
  views: number;
  orders: number;
  paidOrders: number;
  revenueCents: number;
}

export interface DashboardStats {
  signups: DashboardMetric;
  visitors: DashboardMetric;
  views: DashboardMetric;
  orders: DashboardMetric;
  paidOrders: DashboardMetric;
  revenueCents: DashboardMetric;
  pendingOrders: number;
  activeSubs: number;
  activeTrials: number;
  totalClients: number;
  days: DashboardDay[];
  topPages: { path: string; views: number }[];
}

type WindowRow = { d1: number; d1p: number; d7: number; d30: number };

const toMetric = (r: WindowRow | undefined): DashboardMetric => ({
  last24h: r?.d1 ?? 0,
  prev24h: r?.d1p ?? 0,
  last7d: r?.d7 ?? 0,
  last30d: r?.d30 ?? 0,
});

/**
 * Chiffres du dashboard. Les fenêtres « 24 h » sont glissantes ; le graphique
 * est découpé en jours calendaires (Europe/Paris) sur `days` jours.
 * Les commandes refusées / abandonnées étant purgées, « commandes » compte
 * celles encore en base (en attente de paiement, en attente, honorées).
 */
export async function dashboardStats(days = 14): Promise<DashboardStats> {
  const [signups, visitors, views, orders, paid, totals, series, topPages] = await Promise.all([
    sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= now() - interval '24 hours')::int AS d1,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '48 hours'
                           AND created_at <  now() - interval '24 hours')::int AS d1p,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')::int  AS d7,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days')::int AS d30
      FROM users WHERE role = 'client'
    ` as unknown as Promise<WindowRow[]>,
    // Le hachage visiteur change chaque jour : sur 7 / 30 j on somme les
    // visiteurs uniques de chaque jour (= « visites quotidiennes »).
    sql`
      SELECT
        COUNT(DISTINCT visitor) FILTER (WHERE created_at >= now() - interval '24 hours')::int AS d1,
        COUNT(DISTINCT visitor) FILTER (WHERE created_at >= now() - interval '48 hours'
                                          AND created_at <  now() - interval '24 hours')::int AS d1p,
        COUNT(DISTINCT visitor) FILTER (WHERE created_at >= now() - interval '7 days')::int  AS d7,
        COUNT(DISTINCT visitor)::int AS d30
      FROM page_views WHERE created_at >= now() - interval '30 days'
    ` as unknown as Promise<WindowRow[]>,
    sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= now() - interval '24 hours')::int AS d1,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '48 hours'
                           AND created_at <  now() - interval '24 hours')::int AS d1p,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')::int  AS d7,
        COUNT(*)::int AS d30
      FROM page_views WHERE created_at >= now() - interval '30 days'
    ` as unknown as Promise<WindowRow[]>,
    sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= now() - interval '24 hours')::int AS d1,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '48 hours'
                           AND created_at <  now() - interval '24 hours')::int AS d1p,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')::int  AS d7,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days')::int AS d30
      FROM iptv_orders
    ` as unknown as Promise<WindowRow[]>,
    sql`
      SELECT
        COUNT(*) FILTER (WHERE paid_at >= now() - interval '24 hours')::int AS d1,
        COUNT(*) FILTER (WHERE paid_at >= now() - interval '48 hours'
                           AND paid_at <  now() - interval '24 hours')::int AS d1p,
        COUNT(*) FILTER (WHERE paid_at >= now() - interval '7 days')::int  AS d7,
        COUNT(*) FILTER (WHERE paid_at >= now() - interval '30 days')::int AS d30,
        COALESCE(SUM(price_cents) FILTER (WHERE paid_at >= now() - interval '24 hours'), 0)::int AS c1,
        COALESCE(SUM(price_cents) FILTER (WHERE paid_at >= now() - interval '48 hours'
                                            AND paid_at <  now() - interval '24 hours'), 0)::int AS c1p,
        COALESCE(SUM(price_cents) FILTER (WHERE paid_at >= now() - interval '7 days'), 0)::int  AS c7,
        COALESCE(SUM(price_cents) FILTER (WHERE paid_at >= now() - interval '30 days'), 0)::int AS c30
      FROM iptv_orders WHERE status = 'fulfilled' AND paid_at IS NOT NULL
    ` as unknown as Promise<(WindowRow & { c1: number; c1p: number; c7: number; c30: number })[]>,
    sql`
      SELECT
        (SELECT COUNT(*) FROM iptv_orders WHERE status = 'pending')::int AS pending,
        (SELECT COUNT(*) FROM subscriptions
          WHERE status = 'active' AND is_trial = false
            AND (expires_at IS NULL OR expires_at >= CURRENT_DATE))::int AS active_subs,
        (SELECT COUNT(*) FROM subscriptions
          WHERE status = 'active' AND is_trial = true
            AND (expires_at IS NULL OR expires_at >= CURRENT_DATE))::int AS active_trials,
        (SELECT COUNT(*) FROM users WHERE role = 'client')::int AS clients
    ` as unknown as Promise<
      { pending: number; active_subs: number; active_trials: number; clients: number }[]
    >,
    sql`
      WITH d AS (
        SELECT generate_series(
          (now() AT TIME ZONE 'Europe/Paris')::date - (${days}::int - 1),
          (now() AT TIME ZONE 'Europe/Paris')::date,
          interval '1 day'
        )::date AS day
      )
      SELECT
        to_char(d.day, 'YYYY-MM-DD') AS day,
        (SELECT COUNT(*) FROM users u WHERE u.role = 'client'
           AND (u.created_at AT TIME ZONE 'Europe/Paris')::date = d.day)::int AS signups,
        (SELECT COUNT(DISTINCT visitor) FROM page_views p
           WHERE (p.created_at AT TIME ZONE 'Europe/Paris')::date = d.day)::int AS visitors,
        (SELECT COUNT(*) FROM page_views p
           WHERE (p.created_at AT TIME ZONE 'Europe/Paris')::date = d.day)::int AS views,
        (SELECT COUNT(*) FROM iptv_orders o
           WHERE (o.created_at AT TIME ZONE 'Europe/Paris')::date = d.day)::int AS orders,
        (SELECT COUNT(*) FROM iptv_orders o WHERE o.status = 'fulfilled'
           AND (o.paid_at AT TIME ZONE 'Europe/Paris')::date = d.day)::int AS paid_orders,
        (SELECT COALESCE(SUM(price_cents), 0) FROM iptv_orders o WHERE o.status = 'fulfilled'
           AND (o.paid_at AT TIME ZONE 'Europe/Paris')::date = d.day)::int AS revenue_cents
      FROM d ORDER BY d.day
    ` as unknown as Promise<
      {
        day: string;
        signups: number;
        visitors: number;
        views: number;
        orders: number;
        paid_orders: number;
        revenue_cents: number;
      }[]
    >,
    sql`
      SELECT path, COUNT(*)::int AS views FROM page_views
      WHERE created_at >= now() - interval '7 days'
      GROUP BY path ORDER BY views DESC LIMIT 8
    ` as unknown as Promise<{ path: string; views: number }[]>,
  ]);

  const p = paid[0];
  const t = totals[0];
  return {
    signups: toMetric(signups[0]),
    visitors: toMetric(visitors[0]),
    views: toMetric(views[0]),
    orders: toMetric(orders[0]),
    paidOrders: toMetric(p),
    revenueCents: {
      last24h: p?.c1 ?? 0,
      prev24h: p?.c1p ?? 0,
      last7d: p?.c7 ?? 0,
      last30d: p?.c30 ?? 0,
    },
    pendingOrders: t?.pending ?? 0,
    activeSubs: t?.active_subs ?? 0,
    activeTrials: t?.active_trials ?? 0,
    totalClients: t?.clients ?? 0,
    days: series.map((r) => ({
      day: r.day,
      signups: r.signups,
      visitors: r.visitors,
      views: r.views,
      orders: r.orders,
      paidOrders: r.paid_orders,
      revenueCents: r.revenue_cents,
    })),
    topPages,
  };
}

/** Purge des pages vues de plus de 180 jours (appelée par le cron). */
export async function purgeOldPageViews(): Promise<void> {
  try {
    await sql`DELETE FROM page_views WHERE created_at < now() - interval '180 days'`;
  } catch {
    /* best-effort */
  }
}
