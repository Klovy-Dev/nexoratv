import "server-only";
import { appOrigin, escapeHtml, sendEmail } from "@/lib/mail";
import { notifyEmail } from "@/lib/data";
import { formatPrice } from "@/lib/validation";
import type { ProviderKind } from "@/lib/types";

/**
 * E-mails transactionnels liés aux commandes d'abonnement.
 * Tout échec est journalisé mais ne fait jamais échouer l'action métier.
 */

const KIND_FR: Record<ProviderKind, string> = {
  line: "Ligne M3U",
  mag: "Boîtier MAG",
  code: "Code d'activation",
};

export interface OrderMailInfo {
  customerName: string;
  customerEmail: string;
  title: string;
  priceCents: number;
  kind: ProviderKind;
  screens: number | null;
  isRenewal: boolean;
}

function shell(inner: string): string {
  return `
  <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#08090d;padding:32px;color:#e9eaf1">
    <div style="max-width:520px;margin:0 auto;background:#141722;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:32px">
      <p style="font-size:18px;font-weight:700;margin:0 0 20px">Nexora<span style="color:#ff2e9a">TV</span></p>
      ${inner}
      <p style="margin:28px 0 0;font-size:12px;color:#5c6478">NexoraTV — cet e-mail vous est envoyé suite à une action sur votre compte.</p>
    </div>
  </div>`;
}

function detailRows(info: OrderMailInfo): string {
  const rows: [string, string][] = [
    ["Offre", info.title],
    ["Type", KIND_FR[info.kind]],
  ];
  if (info.kind === "line" && info.screens) {
    rows.push(["Écrans", String(info.screens)]);
  }
  rows.push(["Montant", formatPrice(info.priceCents)]);
  return rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#969db1;font-size:13px">${k}</td>
         <td style="padding:6px 0;text-align:right;font-weight:600">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:linear-gradient(120deg,#ff2e9a,#a13bd8,#2f80ed);color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">${label}</a></p>`;
}

/* ------------------------------------------------------------------ */
/*  Commande passée : client + équipe                                  */
/* ------------------------------------------------------------------ */

export async function sendOrderPlacedEmails(info: OrderMailInfo): Promise<void> {
  const origin = await appOrigin();
  const table = `<table style="width:100%;border-collapse:collapse;margin:8px 0 4px">${detailRows(info)}</table>`;

  // --- Client ---
  try {
    await sendEmail({
      to: info.customerEmail,
      subject: info.isRenewal
        ? "Votre demande de renouvellement a bien été reçue"
        : "Votre commande NexoraTV a bien été reçue",
      html: shell(`
        <p style="margin:0 0 16px">Bonjour ${escapeHtml(info.customerName)},</p>
        <p style="margin:0 0 16px">Nous avons bien reçu votre ${info.isRenewal ? "demande de renouvellement" : "commande"}. Notre équipe la valide au plus vite ; vous recevrez un e-mail dès qu'elle est activée.</p>
        ${table}
        ${button(`${origin}/profil`, "Suivre ma commande")}
        <p style="margin:0;font-size:13px;color:#969db1">Aucun paiement n'a été prélevé pour l'instant.</p>
      `),
      text: `Bonjour ${info.customerName},\n\nNous avons bien reçu votre ${info.isRenewal ? "demande de renouvellement" : "commande"} : ${info.title} — ${formatPrice(info.priceCents)}.\nNotre équipe la valide au plus vite.\n\nSuivi : ${origin}/profil`,
    });
  } catch (err) {
    console.error("[order-mail] client 'reçue' échec", err);
  }

  // --- Équipe ---
  try {
    const to = await notifyEmail();
    if (to) {
      await sendEmail({
        to,
        subject: `Nouvelle ${info.isRenewal ? "demande de renouvellement" : "commande"} — ${info.title}`,
        replyTo: info.customerEmail,
        html: shell(`
          <p style="margin:0 0 16px;font-weight:600">${info.isRenewal ? "Renouvellement" : "Nouvelle commande"}</p>
          <table style="width:100%;border-collapse:collapse;margin:8px 0">
            <tr><td style="padding:6px 0;color:#969db1;font-size:13px">Client</td><td style="padding:6px 0;text-align:right;font-weight:600">${escapeHtml(info.customerName)}</td></tr>
            <tr><td style="padding:6px 0;color:#969db1;font-size:13px">E-mail</td><td style="padding:6px 0;text-align:right">${escapeHtml(info.customerEmail)}</td></tr>
            ${detailRows(info)}
          </table>
          ${button(`${origin}/admin/commandes`, "Traiter la commande")}
        `),
        text: `${info.isRenewal ? "Renouvellement" : "Nouvelle commande"}\nClient : ${info.customerName} <${info.customerEmail}>\nOffre : ${info.title} — ${formatPrice(info.priceCents)}\n\n${origin}/admin/commandes`,
      });
    }
  } catch (err) {
    console.error("[order-mail] équipe 'nouvelle commande' échec", err);
  }
}

/* ------------------------------------------------------------------ */
/*  Commande acceptée                                                  */
/* ------------------------------------------------------------------ */

export async function sendOrderAcceptedEmail(
  info: OrderMailInfo & { subscriptionLabel: string },
): Promise<void> {
  try {
    const origin = await appOrigin();
    await sendEmail({
      to: info.customerEmail,
      subject: "Votre abonnement NexoraTV est actif 🎉",
      html: shell(`
        <p style="margin:0 0 16px">Bonjour ${escapeHtml(info.customerName)},</p>
        <p style="margin:0 0 16px">Bonne nouvelle : votre ${info.isRenewal ? "renouvellement" : "abonnement"} <strong>${escapeHtml(info.subscriptionLabel)}</strong> est activé.</p>
        <p style="margin:0 0 16px">Vos identifiants de connexion sont disponibles dans votre espace client.</p>
        ${button(`${origin}/profil`, "Voir mes identifiants")}
        <p style="margin:0;font-size:13px;color:#969db1">Besoin d'aide pour l'installation ? Consultez le <a href="${origin}/tuto" style="color:#a9ccf7">tutoriel</a>.</p>
      `),
      text: `Bonjour ${info.customerName},\n\nVotre ${info.isRenewal ? "renouvellement" : "abonnement"} "${info.subscriptionLabel}" est activé.\nVos identifiants : ${origin}/profil`,
    });
  } catch (err) {
    console.error("[order-mail] client 'acceptée' échec", err);
  }
}

/* ------------------------------------------------------------------ */
/*  Commande refusée                                                   */
/* ------------------------------------------------------------------ */

export async function sendOrderRejectedEmail(
  info: OrderMailInfo & { reason: string },
): Promise<void> {
  try {
    const origin = await appOrigin();
    await sendEmail({
      to: info.customerEmail,
      subject: "Votre commande NexoraTV n'a pas pu être validée",
      html: shell(`
        <p style="margin:0 0 16px">Bonjour ${escapeHtml(info.customerName)},</p>
        <p style="margin:0 0 16px">Votre commande <strong>${escapeHtml(info.title)}</strong> n'a pas pu être validée.</p>
        ${
          info.reason
            ? `<p style="margin:0 0 4px;font-size:13px;color:#969db1">Motif</p><p style="margin:0 0 16px;padding:12px 14px;background:#1c2030;border-radius:10px">${escapeHtml(info.reason)}</p>`
            : ""
        }
        <p style="margin:0 0 16px">Aucun montant n'a été prélevé. Pour toute question, répondez à cet e-mail ou contactez-nous.</p>
        ${button(`${origin}/contact`, "Nous contacter")}
      `),
      text: `Bonjour ${info.customerName},\n\nVotre commande "${info.title}" n'a pas pu être validée.${info.reason ? `\nMotif : ${info.reason}` : ""}\nAucun montant n'a été prélevé.\n\nContact : ${origin}/contact`,
    });
  } catch (err) {
    console.error("[order-mail] client 'refusée' échec", err);
  }
}
