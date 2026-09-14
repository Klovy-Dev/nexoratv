import { NextResponse } from "next/server";
import { expiringSubscriptionsForReminder } from "@/lib/data";

/**
 * Consommée quotidiennement par le bot pour envoyer un rappel DM avant
 * l'expiration d'un abonnement payant.
 *   curl -H "Authorization: Bearer <DISCORD_BOT_SECRET>" "https://.../api/discord/expiring-soon"
 */

export const dynamic = "force-dynamic";

const REMINDER_DAYS = 3;

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.DISCORD_BOT_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const subscriptions = await expiringSubscriptionsForReminder(REMINDER_DAYS);
  return NextResponse.json({ subscriptions });
}
