import crypto from "node:crypto";
import { getCurrentUser, clientIp } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|curl|wget/i;

/**
 * Mesure d'audience maison, appelée par <VisitTracker /> à chaque page vue.
 * Aucun cookie : le visiteur est un hachage (IP + UA + jour + secret) qui
 * change chaque jour, donc impossible à relier d'un jour à l'autre.
 * Les admins et les robots ne sont pas comptés.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const ua = req.headers.get("user-agent") ?? "";
    if (!ua || BOT_UA.test(ua)) return new Response(null, { status: 204 });

    const body = (await req.json().catch(() => null)) as { path?: unknown } | null;
    const path = typeof body?.path === "string" ? body.path.split("?")[0].slice(0, 200) : "";
    if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) {
      return new Response(null, { status: 204 });
    }

    const user = await getCurrentUser();
    if (user?.role === "admin") return new Response(null, { status: 204 });

    const day = new Date().toISOString().slice(0, 10);
    const visitor = crypto
      .createHash("sha256")
      .update(`${await clientIp()}|${ua}|${day}|${process.env.AUTH_SECRET ?? ""}`)
      .digest("hex")
      .slice(0, 32);

    await sql`INSERT INTO page_views (path, visitor) VALUES (${path}, ${visitor})`;
  } catch {
    /* la mesure d'audience ne doit jamais faire échouer la navigation */
  }
  return new Response(null, { status: 204 });
}
