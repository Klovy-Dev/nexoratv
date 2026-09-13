import { NextResponse } from "next/server";
import { getProfile, goldenottConfigured, listDomains } from "@/lib/goldenott";

/**
 * Consommée par le bot Discord pour poster/mettre à jour l'embed de statut
 * dans #statut-serveurs. GoldenOTT n'expose aucun endpoint de statut/maintenance
 * officiel (vérifié sur /api/documentation) : on déduit donc l'état en testant
 * la joignabilité de l'API compte et de chaque domaine DNS configuré.
 *
 *   curl -H "Authorization: Bearer <DISCORD_BOT_SECRET>" https://.../api/discord/server-status
 */

export const dynamic = "force-dynamic";

interface DomainCheck {
  domain: string;
  ok: boolean;
  forTv: boolean;
  forBypass: boolean;
  isDefault: boolean;
}

async function checkReachable(url: string): Promise<boolean> {
  try {
    // Beaucoup de domaines IPTV répondent 403/404 sur "/" tout en étant up :
    // on ne considère hors service que les erreurs réseau/timeout, pas le code HTTP.
    await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(6000), redirect: "follow" });
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.DISCORD_BOT_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!goldenottConfigured()) {
    return NextResponse.json({ error: "goldenott not configured" }, { status: 503 });
  }

  let panelOk = true;
  let panelMessage = "OK";
  try {
    await getProfile();
  } catch (err) {
    panelOk = false;
    panelMessage = err instanceof Error ? err.message : "Erreur inconnue";
  }

  let domains: DomainCheck[] = [];
  try {
    const list = await listDomains();
    domains = await Promise.all(
      list.map(async (d) => ({
        domain: d.domain,
        ok: await checkReachable(`https://${d.domain}/`),
        forTv: d.forTv,
        forBypass: d.forBypass,
        isDefault: d.isDefault,
      })),
    );
  } catch {
    domains = [];
  }

  return NextResponse.json({
    panel: { ok: panelOk, message: panelMessage },
    domains,
    checkedAt: new Date().toISOString(),
  });
}
