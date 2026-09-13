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
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const statuses = await discordRoleStatuses();
  return NextResponse.json({ statuses });
}
