import { NextResponse } from "next/server";
import { appUserFromRequest } from "@/lib/app-auth";
import { subscriptionsForUser } from "@/lib/data";
import { lineM3uUrl } from "@/lib/goldenott";

/**
 * Compte et abonnements du client, pour l'application NexoraTV.
 *
 *   GET /api/app/me   (Authorization: Bearer <jeton de /api/app/login>)
 *   200 { "user": {...}, "subscriptions": [...] }
 *   401 { "error": "unauthorized" }   — jeton absent, expiré ou révoqué
 *
 * `playable` : l'abonnement a des identifiants Xtream exploitables par
 * l'appli (lignes M3U ; pas les boîtiers MAG ni les codes d'activation).
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const user = await appUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const subs = await subscriptionsForUser(user.id);
  return NextResponse.json(
    {
      user: { name: user.name, email: user.email },
      subscriptions: subs.map((s) => {
        const kind = s.provider_kind ?? "line";
        const playable = kind === "line" && Boolean(s.server_url && s.username && s.password);
        return {
          id: s.id,
          label: s.label,
          kind,
          playable,
          serverUrl: playable ? s.server_url : null,
          username: playable ? s.username : null,
          password: playable ? s.password : null,
          m3uUrl: playable ? lineM3uUrl(s.server_url, s.username, s.password) : null,
          expiresAt: s.expires_at,
          expired: s.expired,
          active: s.status === "active" && !s.expired,
          isTrial: s.is_trial,
          screens: s.screens,
        };
      }),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
