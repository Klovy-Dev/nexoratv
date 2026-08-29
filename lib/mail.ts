import "server-only";
import { headers } from "next/headers";

/**
 * Envoi d'e-mail via l'API Resend (https://resend.com).
 *
 * Configuration (variables d'environnement) :
 *   RESEND_API_KEY  clé API Resend (re_...)
 *   MAIL_FROM       expéditeur, ex. "NexoraTV <no-reply@votre-domaine.fr>"
 *   APP_URL         (facultatif) URL publique, ex. https://nexoratv.vercel.app
 *
 * Sans RESEND_API_KEY, l'e-mail n'est pas envoyé : son contenu est écrit
 * dans les logs (pratique en développement).
 */

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: SendArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "NexoraTV <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(
      `[mail] RESEND_API_KEY absent — e-mail NON envoyé.\n` +
        `  À      : ${to}\n` +
        `  Objet  : ${subject}\n` +
        `  ------\n${text}\n  ------`,
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend a répondu ${res.status} : ${detail}`);
  }
}

/** URL publique de l'application (pour construire des liens dans les e-mails). */
export async function appOrigin(): Promise<string> {
  const fromEnv = process.env.APP_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function resetEmailHtml(
  name: string,
  link: string,
  minutes: number,
): string {
  return `
  <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#08090d;padding:32px;color:#e9eaf1">
    <div style="max-width:480px;margin:0 auto;background:#141722;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:32px">
      <p style="font-size:18px;font-weight:700;margin:0 0 20px">Nexora<span style="color:#ff2e9a">TV</span></p>
      <p style="margin:0 0 16px">Bonjour ${escapeHtml(name)},</p>
      <p style="margin:0 0 16px">Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau. Ce lien est valable ${minutes} minutes.</p>
      <p style="margin:24px 0">
        <a href="${link}" style="display:inline-block;background:linear-gradient(120deg,#ff2e9a,#a13bd8,#2f80ed);color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">Choisir un nouveau mot de passe</a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#969db1">Si le bouton ne fonctionne pas, copiez ce lien :</p>
      <p style="margin:0 0 16px;font-size:13px;word-break:break-all"><a href="${link}" style="color:#a9ccf7">${link}</a></p>
      <p style="margin:0;font-size:13px;color:#969db1">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.</p>
    </div>
  </div>`;
}

export function contactEmailHtml(
  name: string,
  email: string,
  subject: string,
  message: string,
): string {
  return `
  <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#08090d;padding:32px;color:#e9eaf1">
    <div style="max-width:520px;margin:0 auto;background:#141722;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:32px">
      <p style="font-size:18px;font-weight:700;margin:0 0 20px">Nexora<span style="color:#ff2e9a">TV</span> — Contact</p>
      <p style="margin:0 0 4px;font-size:13px;color:#969db1">De</p>
      <p style="margin:0 0 16px">${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
      <p style="margin:0 0 4px;font-size:13px;color:#969db1">Objet</p>
      <p style="margin:0 0 16px">${escapeHtml(subject)}</p>
      <p style="margin:0 0 4px;font-size:13px;color:#969db1">Message</p>
      <p style="margin:0;white-space:pre-wrap">${escapeHtml(message)}</p>
    </div>
  </div>`;
}

export function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] ?? c,
  );
}
