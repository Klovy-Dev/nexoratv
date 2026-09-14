import { NextResponse } from "next/server";
import { subscriptionsForDiscordId } from "@/lib/data";

/**
 * Consommée par /mon-abonnement sur Discord.
 *   curl -H "Authorization: Bearer <DISCORD_BOT_SECRET>" \
 *     "https://.../api/discord/subscription?discordId=..."
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.DISCORD_BOT_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const discordId = new URL(req.url).searchParams.get("discordId");
  if (!discordId) {
    return NextResponse.json({ error: "discordId manquant" }, { status: 400 });
  }

  const subscriptions = await subscriptionsForDiscordId(discordId);
  if (subscriptions === null) {
    return NextResponse.json({ linked: false });
  }

  return NextResponse.json({ linked: true, subscriptions });
}
