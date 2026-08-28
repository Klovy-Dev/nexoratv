"use server";

import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import {
  clientIp,
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import {
  LOGIN_LOCKOUT_MINUTES,
  LOGIN_MAX_ATTEMPTS,
  isEmail,
  passwordProblems,
  str,
} from "@/lib/validation";
import type { FormState } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Inscription                                                        */
/* ------------------------------------------------------------------ */

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = str(formData.get("name"));
  const email = str(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("password_confirm") ?? "");
  const accepted = formData.get("accept") === "on";
  const honeypot = str(formData.get("website"));

  const errors: string[] = [];
  if (honeypot) errors.push("Requête invalide.");
  if (name.length < 2) errors.push("Le nom doit comporter au moins 2 caractères.");
  if (!isEmail(email)) errors.push("Adresse e-mail invalide.");
  errors.push(...passwordProblems(password));
  if (password !== confirm) errors.push("Les deux mots de passe ne correspondent pas.");
  if (!accepted) errors.push("Vous devez accepter les conditions d'utilisation.");

  if (errors.length > 0) return { fieldErrors: errors };

  const existing = await sql`SELECT 1 FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    return { fieldErrors: ["Impossible de créer le compte avec ces informations."] };
  }

  // Le tout premier compte devient administrateur s'il n'en existe aucun.
  const admins = await sql`SELECT 1 FROM users WHERE role = 'admin' LIMIT 1`;
  const role = admins.length === 0 ? "admin" : "client";

  const hash = await hashPassword(password);
  const inserted = (await sql`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (${name}, ${email}, ${hash}, ${role})
    RETURNING id
  `) as unknown as { id: number }[];

  await createSession(inserted[0].id);
  redirect("/profil?bienvenue=1");
}

/* ------------------------------------------------------------------ */
/*  Connexion                                                          */
/* ------------------------------------------------------------------ */

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = str(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ip = await clientIp();

  const locked = (await sql`
    SELECT COUNT(*)::int AS n FROM login_attempts
    WHERE email = ${email} AND ip = ${ip}
      AND attempted_at > now() - make_interval(mins => ${LOGIN_LOCKOUT_MINUTES})
  `) as unknown as { n: number }[];

  if (locked[0].n >= LOGIN_MAX_ATTEMPTS) {
    return {
      error: `Trop de tentatives. Réessayez dans ${LOGIN_LOCKOUT_MINUTES} minutes.`,
    };
  }

  const rows = (await sql`
    SELECT id, password_hash FROM users WHERE email = ${email}
  `) as unknown as { id: number; password_hash: string }[];

  const user = rows[0];
  const valid = user ? await verifyPassword(password, user.password_hash) : false;

  if (!user || !valid) {
    await sql`INSERT INTO login_attempts (email, ip) VALUES (${email}, ${ip})`;
    // Nettoyage opportuniste des vieilles entrées.
    await sql`DELETE FROM login_attempts WHERE attempted_at < now() - make_interval(days => 1)`;
    return { error: "Adresse e-mail ou mot de passe incorrect." };
  }

  await sql`DELETE FROM login_attempts WHERE email = ${email} AND ip = ${ip}`;
  await createSession(user.id);

  const roleRows = (await sql`SELECT role FROM users WHERE id = ${user.id}`) as unknown as {
    role: string;
  }[];
  redirect(roleRows[0]?.role === "admin" ? "/admin" : "/profil");
}

/* ------------------------------------------------------------------ */
/*  Déconnexion                                                        */
/* ------------------------------------------------------------------ */

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/?deconnexion=1");
}
