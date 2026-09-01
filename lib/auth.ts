import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import type { User } from "@/lib/types";

export const SESSION_COOKIE = "nexoratv_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

function secretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "AUTH_SECRET manquant ou trop court (32 caractères minimum, voir .env.example).",
    );
  }
  return new TextEncoder().encode(s);
}

/* ---------- Mots de passe ---------- */

export function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}

export function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

/* ---------- Session ---------- */

/**
 * Le jeton porte l'identité complète (nom, e-mail, rôle, date d'inscription)
 * pour que le rendu de l'en-tête et la plupart des pages n'aient PAS à
 * interroger la base à chaque requête. Les accès sensibles (`requireAdmin`)
 * revérifient le rôle en base.
 */
export async function createSession(user: User): Promise<void> {
  const createdAt: unknown = user.created_at;
  const token = await new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
    created_at:
      createdAt instanceof Date ? createdAt.toISOString() : String(createdAt ?? ""),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Recharge l'utilisateur depuis la base et réémet le cookie de session. */
export async function refreshSession(userId: number): Promise<User | null> {
  const rows = (await sql`
    SELECT id, name, email, role, created_at FROM users WHERE id = ${userId}
  `) as unknown as User[];
  if (!rows[0]) return null;
  await createSession(rows[0]);
  return rows[0];
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;

    // Jeton « nouvelle génération » : identité complète dans les claims.
    if (typeof payload.role === "string" && typeof payload.email === "string") {
      return {
        id,
        name: String(payload.name ?? ""),
        email: payload.email,
        role: payload.role === "admin" ? "admin" : "client",
        created_at: String(payload.created_at ?? ""),
      };
    }

    // Ancien jeton (sub uniquement) : on complète depuis la base.
    const rows = (await sql`
      SELECT id, name, email, role, created_at
      FROM users WHERE id = ${id}
    `) as unknown as User[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");

  // Revérification en base : un compte rétrogradé perd l'accès immédiatement,
  // sans attendre l'expiration du jeton.
  const rows = (await sql`
    SELECT role FROM users WHERE id = ${user.id}
  `) as unknown as { role: string }[];
  if (rows[0]?.role !== "admin") redirect("/");

  return user;
}

/* ---------- Utilitaires ---------- */

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "0.0.0.0"
  );
}
