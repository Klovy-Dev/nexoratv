import { NextResponse } from "next/server";
import { discordStatsSnapshot } from "@/lib/data";
import { sql } from "@/lib/db";

/**
 * Consommée par /stats sur Discord.
 *   curl -H "Authorization: Bearer <DISCORD_BOT_SECRET>" "https://.../api/discord/stats"
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.DISCORD_BOT_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // DIAGNOSTIC TEMPORAIRE (à retirer) : liste des essais en cours.
  if (new URL(req.url).searchParams.get("debug") === "1") {
    const rows = await sql`
      SELECT s.id, s.label, s.provider, s.is_trial, s.status, s.expires_at,
             s.package_label, s.synced_at, u.email
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      WHERE s.is_trial = true
      ORDER BY s.created_at DESC
      LIMIT 30
    `;
    return NextResponse.json({ debug: rows });
  }

  const stats = await discordStatsSnapshot();
  return NextResponse.json(stats);
}
