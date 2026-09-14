import { NextResponse } from "next/server";
import { expiringSubscriptionsForReminder, expiringTrialsForReminder } from "@/lib/data";

/**
 * Consommée quotidiennement par le bot pour envoyer un rappel DM :
 * - `subscriptions` : abonnements payants à J-3 (renouvellement)
 * - `trials` : essais qui se terminent aujourd'hui (relance vers un forfait payant)
 *   curl -H "Authorization: Bearer <DISCORD_BOT_SECRET>" "https://.../api/discord/expiring-soon"
 */

export const dynamic = "force-dynamic";

const REMINDER_DAYS = 3;

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.DISCORD_BOT_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [subscriptions, trials] = await Promise.all([
    expiringSubscriptionsForReminder(REMINDER_DAYS),
    expiringTrialsForReminder(),
  ]);

  return NextResponse.json({ subscriptions, trials });
}
