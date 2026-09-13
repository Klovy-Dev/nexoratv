import { NextResponse } from "next/server";
import { discordRoleStatuses } from "@/lib/data";

/**
 * Consommée par le bot Discord (poll toutes les 5 min) pour synchroniser
 * les rôles du serveur selon l'abonnement de chaque client.
 *
 *   curl -H "Authorization: Bearer <DISCORD_BOT_SECRET>" https://.../api/discord/roles
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  // Fail-closed : sans secret configuré, la route reste fermée.
  const secret = process.env.DISCORD_BOT_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    // DIAGNOSTIC TEMPORAIRE (à retirer) : aucune valeur secrète n'est exposée,
    // seulement des booléens/longueurs pour localiser le problème.
    return NextResponse.json(
      {
        error: "unauthorized",
        debug: {
          secretConfigured: Boolean(secret),
          secretLength: secret?.length ?? 0,
          gotAuthHeader: Boolean(authHeader),
          authHeaderLength: authHeader?.length ?? 0,
        },
      },
      { status: 401 },
    );
  }

  const statuses = await discordRoleStatuses();
  return NextResponse.json({ statuses });
}
