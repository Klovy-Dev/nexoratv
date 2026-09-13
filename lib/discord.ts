import "server-only";

const DISCORD_API = "https://discord.com/api/v10";

export const DISCORD_STATE_COOKIE = "nexoratv_discord_state";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} manquant (voir .env.example)`);
  return v;
}

export function discordOAuthConfigured(): boolean {
  return Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
}

export function buildDiscordAuthorizeUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: env("DISCORD_CLIENT_ID"),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeDiscordCode(
  code: string,
  redirectUri: string,
): Promise<{ access_token: string }> {
  const body = new URLSearchParams({
    client_id: env("DISCORD_CLIENT_ID"),
    client_secret: env("DISCORD_CLIENT_SECRET"),
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Échange du code Discord échoué (${res.status})`);
  }
  return res.json();
}

export async function fetchDiscordIdentity(
  accessToken: string,
): Promise<{ id: string; username: string }> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Récupération du profil Discord échouée (${res.status})`);
  }
  return res.json();
}
