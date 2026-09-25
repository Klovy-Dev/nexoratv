import "server-only";
import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { secretKey } from "@/lib/auth";
import { sql } from "@/lib/db";

/**
 * Authentification de l'application NexoraTV (Windows / Android).
 *
 * L'appli n'a pas de cookie : elle reçoit un jeton à la connexion
 * (`POST /api/app/login`) et l'envoie ensuite dans l'en-tête
 * `Authorization: Bearer <jeton>`.
 *
 * - Audience dédiée : un jeton d'appli ne vaut pas session sur le site.
 * - Le jeton embarque une empreinte du mot de passe : changer (ou
 *   réinitialiser) son mot de passe déconnecte toutes les applis.
 */

const AUDIENCE = "nexoratv-app";
const TOKEN_DAYS = 90;

function passwordStamp(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

export async function signAppToken(user: { id: number; password_hash: string }): Promise<string> {
  return new SignJWT({ pwd: passwordStamp(user.password_hash) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_DAYS}d`)
    .sign(secretKey());
}

export interface AppUser {
  id: number;
  name: string;
  email: string;
}

/** Utilisateur authentifié par le jeton de l'appli, ou null. */
export async function appUserFromRequest(req: Request): Promise<AppUser | null> {
  const match = (req.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  try {
    const { payload } = await jwtVerify(match[1], secretKey(), { audience: AUDIENCE });
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;

    const rows = (await sql`
      SELECT id, name, email, password_hash FROM users WHERE id = ${id}
    `) as unknown as (AppUser & { password_hash: string })[];
    const user = rows[0];
    if (!user || passwordStamp(user.password_hash) !== payload.pwd) return null;

    return { id: user.id, name: user.name, email: user.email };
  } catch {
    return null;
  }
}
