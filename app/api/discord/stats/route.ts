import { NextResponse } from "next/server";
import { discordStatsSnapshot } from "@/lib/data";

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

  const stats = await discordStatsSnapshot();
  return NextResponse.json(stats);
}
