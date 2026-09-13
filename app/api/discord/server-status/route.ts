import { NextResponse } from "next/server";
import { getProfile, goldenottConfigured } from "@/lib/goldenott";

/**
 * Consommée par le bot Discord pour poster/mettre à jour l'embed de statut
 * dans #statut-serveurs. GoldenOTT n'expose aucun endpoint de statut/maintenance
 * officiel (vérifié sur /api/documentation) : on ne peut donc juger que la
 * joignabilité de l'API compte elle-même, pas des domaines IPTV individuels
 * (leur test depuis une IP de datacenter donne des faux négatifs — beaucoup de
 * panels IPTV bloquent les IP cloud/anti-scraping).
 *
 *   curl -H "Authorization: Bearer <DISCORD_BOT_SECRET>" https://.../api/discord/server-status
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.DISCORD_BOT_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!goldenottConfigured()) {
    return NextResponse.json({ error: "goldenott not configured" }, { status: 503 });
  }

  try {
    const profile = await getProfile();
    return NextResponse.json({
      panel: { ok: true, message: "OK" },
      profile: { username: profile.username, credit: profile.credit },
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({
      panel: { ok: false, message: err instanceof Error ? err.message : "Erreur inconnue" },
      profile: null,
      checkedAt: new Date().toISOString(),
    });
  }
}
