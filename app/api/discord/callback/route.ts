import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { appOrigin } from "@/lib/mail";
import { setDiscordId } from "@/lib/data";
import { DISCORD_STATE_COOKIE, exchangeDiscordCode, fetchDiscordIdentity } from "@/lib/discord";

export const dynamic = "force-dynamic";

function redirectToProfil(origin: string, query: string): Response {
  return NextResponse.redirect(`${origin}/profil?onglet=compte&${query}`);
}

export async function GET(req: Request): Promise<Response> {
  const user = await requireUser();
  const origin = await appOrigin();

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const store = await cookies();
  const expectedState = store.get(DISCORD_STATE_COOKIE)?.value;
  store.delete(DISCORD_STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectToProfil(origin, "discord=error");
  }

  try {
    const redirectUri = `${origin}/api/discord/callback`;
    const token = await exchangeDiscordCode(code, redirectUri);
    const identity = await fetchDiscordIdentity(token.access_token);

    const ok = await setDiscordId(user.id, identity.id);
    return redirectToProfil(origin, ok ? "discord=linked" : "discord=conflict");
  } catch {
    return redirectToProfil(origin, "discord=error");
  }
}
