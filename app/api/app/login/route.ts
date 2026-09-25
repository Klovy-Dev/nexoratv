import { NextResponse } from "next/server";
import { clientIp, verifyPassword } from "@/lib/auth";
import { signAppToken } from "@/lib/app-auth";
import { sql } from "@/lib/db";
import { LOGIN_LOCKOUT_MINUTES, LOGIN_MAX_ATTEMPTS } from "@/lib/validation";

/**
 * Connexion depuis l'application NexoraTV.
 *
 *   POST /api/app/login   { "email": "...", "password": "..." }
 *   200 { "token": "...", "user": { "name": "...", "email": "..." } }
 *   401 { "error": "invalid_credentials", "message": "..." }
 *   429 { "error": "locked", "message": "..." }
 *
 * Même anti-bruteforce que le formulaire du site (table login_attempts).
 */

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const ip = await clientIp();

  const locked = (await sql`
    SELECT COUNT(*)::int AS n FROM login_attempts
    WHERE email = ${email} AND ip = ${ip}
      AND attempted_at > now() - make_interval(mins => ${LOGIN_LOCKOUT_MINUTES})
  `) as unknown as { n: number }[];
  if (locked[0].n >= LOGIN_MAX_ATTEMPTS) {
    return NextResponse.json(
      {
        error: "locked",
        message: `Trop de tentatives. Réessayez dans ${LOGIN_LOCKOUT_MINUTES} minutes.`,
      },
      { status: 429 },
    );
  }

  const rows = (await sql`
    SELECT id, name, email, password_hash FROM users WHERE email = ${email}
  `) as unknown as { id: number; name: string; email: string; password_hash: string }[];
  const user = rows[0];
  const valid = user ? await verifyPassword(password, user.password_hash) : false;

  if (!user || !valid) {
    await sql`INSERT INTO login_attempts (email, ip) VALUES (${email}, ${ip})`;
    return NextResponse.json(
      { error: "invalid_credentials", message: "Adresse e-mail ou mot de passe incorrect." },
      { status: 401 },
    );
  }

  await sql`DELETE FROM login_attempts WHERE email = ${email} AND ip = ${ip}`;
  return NextResponse.json(
    { token: await signAppToken(user), user: { name: user.name, email: user.email } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
