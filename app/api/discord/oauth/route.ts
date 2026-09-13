import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { requireUser } from "@/lib/auth";
import { appOrigin } from "@/lib/mail";
import {
  DISCORD_STATE_COOKIE,
  buildDiscordAuthorizeUrl,
  discordOAuthConfigured,
} from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  await requireUser(); // redirige vers /connexion si non connecté

  if (!discordOAuthConfigured()) {
    return NextResponse.json({ error: "discord oauth not configured" }, { status: 503 });
  }

  const state = randomBytes(24).toString("base64url");
  const origin = await appOrigin();
  const redirectUri = `${origin}/api/discord/callback`;

  const store = await cookies();
  store.set(DISCORD_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return NextResponse.redirect(buildDiscordAuthorizeUrl(redirectUri, state));
}
