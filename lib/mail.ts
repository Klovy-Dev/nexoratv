import "server-only";
import { headers } from "next/headers";
import {
  emailButton,
  escapeHtml,
  infoTable,
  p,
  renderEmail,
} from "@/lib/email-layout";

export { escapeHtml };

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
  const siteUrl = safeOrigin(link);
  return renderEmail({
    preheader: `Lien de réinitialisation valable ${minutes} minutes.`,
    title: "Réinitialisation de votre mot de passe",
    siteUrl,
    bodyHtml: `
      ${p(`Bonjour ${escapeHtml(name)},`)}
      ${p(`Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau — ce lien est valable <strong>${minutes} minutes</strong>.`)}
      ${emailButton(link, "Choisir un nouveau mot de passe")}
      <p style="margin:0 0 8px;font-size:13px;color:#828aa0">Si le bouton ne fonctionne pas, copiez ce lien :</p>
      <p style="margin:0 0 18px;font-size:13px;word-break:break-all"><a href="${link}" style="color:#7fb0f5">${escapeHtml(link)}</a></p>
      ${p(`<span style="color:#828aa0;font-size:13px">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.</span>`)}
    `,
  });
}

export function contactEmailHtml(
  name: string,
  email: string,
  subject: string,
  message: string,
  siteUrl = "https://nexoratv.fr",
): string {
  return renderEmail({
    preheader: `${name} — ${subject}`,
    title: "Nouveau message via le formulaire de contact",
    siteUrl,
    bodyHtml: `
      ${infoTable([
        ["De", `${name} <${email}>`],
        ["Objet", subject],
      ])}
      <p style="margin:16px 0 6px;font-size:13px;color:#828aa0">Message</p>
      <p style="margin:0;white-space:pre-wrap;background:#1b1f2b;border-radius:8px;padding:14px 16px">${escapeHtml(message)}</p>
      ${p(`<span style="color:#828aa0;font-size:13px">Répondez directement à cet e-mail pour recontacter l'expéditeur.</span>`)}
    `,
  });
}

function safeOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "https://nexoratv.fr";
  }
}
