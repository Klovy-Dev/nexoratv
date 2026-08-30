import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { subscriptionById } from "@/lib/data";
import { syncSubscriptionLocal } from "@/lib/goldenott-provision";
import { goldenottConfigured } from "@/lib/goldenott";

/**
 * Synchronisation planifiée des abonnements GoldenOTT.
 *
 * Sur Vercel : configurée dans `vercel.json` (Cron Jobs). Vercel ajoute
 * automatiquement l'en-tête `Authorization: Bearer $CRON_SECRET` si la
 * variable CRON_SECRET est définie — on la vérifie ici.
 *
 * Appel manuel :
 *   curl -H "Authorization: Bearer <CRON_SECRET>" https://.../api/cron/goldenott-sync
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!goldenottConfigured()) {
    return NextResponse.json({ error: "goldenott not configured" }, { status: 503 });
  }

  const rows = (await sql`
    SELECT id FROM subscriptions
    WHERE provider = 'goldenott'
    ORDER BY COALESCE(synced_at, to_timestamp(0)) ASC
    LIMIT 200
  `) as unknown as { id: number }[];

  let synced = 0;
  let changed = 0;
  let failed = 0;

  for (const { id } of rows) {
    const sub = await subscriptionById(id);
    if (!sub) continue;
    try {
      const res = await syncSubscriptionLocal(sub, "cron");
      synced++;
      if (res.changed) changed++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    total: rows.length,
    synced,
    changed,
    failed,
    at: new Date().toISOString(),
  });
}
