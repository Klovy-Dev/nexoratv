"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import {
  clientIp,
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { appOrigin, resetEmailHtml, sendEmail } from "@/lib/mail";
import {
  LOGIN_LOCKOUT_MINUTES,
  LOGIN_MAX_ATTEMPTS,
  isEmail,
  passwordProblems,
  str,
} from "@/lib/validation";
import type { FormState } from "@/lib/types";

const RESET_TTL_MINUTES = 30;
const RESET_MAX_PER_15MIN = 3;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Redirection interne sûre (évite les redirections ouvertes). */
function safePath(value: string): string | null {
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/connexion") || value.startsWith("/inscription")) {
    return null;
  }
  return value;
}

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
  const next = safePath(str(formData.get("next")));
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
  redirect(next ?? (roleRows[0]?.role === "admin" ? "/admin" : "/profil"));
}

/* ------------------------------------------------------------------ */
/*  Mot de passe oublié — demande de lien                              */
/* ------------------------------------------------------------------ */

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = str(formData.get("email")).toLowerCase();
  const honeypot = str(formData.get("website"));

  if (honeypot) return { ok: true };
  if (!isEmail(email)) return { fieldErrors: ["Adresse e-mail invalide."] };

  const rows = (await sql`
    SELECT id, name FROM users WHERE email = ${email}
  `) as unknown as { id: number; name: string }[];
  const user = rows[0];

  if (user) {
    const recent = (await sql`
      SELECT COUNT(*)::int AS n FROM password_resets
      WHERE user_id = ${user.id}
        AND created_at > now() - interval '15 minutes'
    `) as unknown as { n: number }[];

    if (recent[0].n < RESET_MAX_PER_15MIN) {
      const token = randomBytes(32).toString("base64url");
      await sql`
        INSERT INTO password_resets (user_id, token_hash, expires_at)
        VALUES (
          ${user.id},
          ${hashToken(token)},
          now() + make_interval(mins => ${RESET_TTL_MINUTES})
        )
      `;
      // Nettoyage opportuniste des jetons expirés.
      await sql`DELETE FROM password_resets WHERE expires_at < now() - interval '1 day'`;

      const link = `${await appOrigin()}/reinitialiser-mot-de-passe?token=${token}`;
      try {
        await sendEmail({
          to: email,
          subject: "Réinitialisation de votre mot de passe NexoraTV",
          text:
            `Bonjour ${user.name},\n\n` +
            `Pour choisir un nouveau mot de passe, ouvrez ce lien ` +
            `(valable ${RESET_TTL_MINUTES} minutes) :\n${link}\n\n` +
            `Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.`,
          html: resetEmailHtml(user.name, link, RESET_TTL_MINUTES),
        });
      } catch (err) {
        console.error("[reset] envoi e-mail échoué :", err);
      }
    }
  }

  // Réponse identique que le compte existe ou non (anti-énumération).
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Mot de passe oublié — choix du nouveau mot de passe                */
/* ------------------------------------------------------------------ */

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = str(formData.get("token"));
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("password_confirm") ?? "");

  const errors: string[] = [];
  if (!token) errors.push("Lien de réinitialisation invalide.");
  errors.push(...passwordProblems(password));
  if (password !== confirm) {
    errors.push("Les deux mots de passe ne correspondent pas.");
  }
  if (errors.length > 0) return { fieldErrors: errors };

  const rows = (await sql`
    SELECT id, user_id FROM password_resets
    WHERE token_hash = ${hashToken(token)}
      AND used_at IS NULL
      AND expires_at > now()
    LIMIT 1
  `) as unknown as { id: number; user_id: number }[];
  const record = rows[0];

  if (!record) {
    return {
      error:
        "Ce lien est invalide ou a expiré. Merci de refaire une demande.",
    };
  }

  const hash = await hashPassword(password);
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${record.user_id}`;
  // Invalide ce jeton et tout autre jeton en attente pour ce compte.
  await sql`
    UPDATE password_resets SET used_at = now()
    WHERE user_id = ${record.user_id} AND used_at IS NULL
  `;
  // Lève un éventuel verrou anti-brute-force sur ce compte.
  await sql`
    DELETE FROM login_attempts
    WHERE email = (SELECT email FROM users WHERE id = ${record.user_id})
  `;

  redirect("/connexion?reinitialise=1");
}

/* ------------------------------------------------------------------ */
/*  Déconnexion                                                        */
/* ------------------------------------------------------------------ */

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/?deconnexion=1");
}
