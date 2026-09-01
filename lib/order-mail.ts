import "server-only";
import { appOrigin, sendEmail } from "@/lib/mail";
import {
  emailButton,
  escapeHtml,
  infoTable,
  noteBox,
  p,
  renderEmail,
} from "@/lib/email-layout";
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

function rows(info: OrderMailInfo): [string, string][] {
  const r: [string, string][] = [
    ["Offre", info.title],
    ["Type", KIND_FR[info.kind]],
  ];
  if (info.kind === "line" && info.screens && info.screens > 1) {
    r.push(["Écrans", String(info.screens)]);
  }
  r.push(["Montant", formatPrice(info.priceCents)]);
  return r;
}

/* ------------------------------------------------------------------ */
/*  Commande passée : client + équipe                                  */
/* ------------------------------------------------------------------ */

export async function sendOrderPlacedEmails(info: OrderMailInfo): Promise<void> {
  const site = await appOrigin();
  const noun = info.isRenewal ? "demande de renouvellement" : "commande";

  try {
    await sendEmail({
      to: info.customerEmail,
      subject: info.isRenewal
        ? "Votre demande de renouvellement a bien été reçue"
        : "Votre commande NexoraTV a bien été reçue",
      html: renderEmail({
        preheader: `${info.title} — ${formatPrice(info.priceCents)}. Validation en cours.`,
        title: "Nous avons bien reçu votre commande",
        siteUrl: site,
        bodyHtml: `
          ${p(`Bonjour ${escapeHtml(info.customerName)},`)}
          ${p(`Votre ${noun} est enregistrée. Notre équipe la valide au plus vite ; vous recevrez un e-mail dès qu'elle est activée.`)}
          ${infoTable(rows(info))}
          ${emailButton(`${site}/profil`, "Suivre ma commande")}
          ${p(`<span style="color:#828aa0;font-size:13px">Aucun paiement n'a été prélevé pour l'instant.</span>`)}
        `,
      }),
      text: `Bonjour ${info.customerName},\n\nVotre ${noun} est enregistrée : ${info.title} — ${formatPrice(info.priceCents)}.\nNotre équipe la valide au plus vite.\n\nSuivi : ${site}/profil`,
    });
  } catch (err) {
    console.error("[order-mail] client 'reçue' échec", err);
  }

  try {
    const to = await notifyEmail();
    if (to) {
      await sendEmail({
        to,
        subject: `Nouvelle ${noun} — ${info.title}`,
        replyTo: info.customerEmail,
        html: renderEmail({
          preheader: `${info.customerName} · ${info.title} · ${formatPrice(info.priceCents)}`,
          title: info.isRenewal ? "Demande de renouvellement" : "Nouvelle commande",
          siteUrl: site,
          bodyHtml: `
            ${infoTable([
              ["Client", info.customerName],
              ["E-mail", info.customerEmail],
              ...rows(info),
            ])}
            ${emailButton(`${site}/admin/commandes`, "Traiter la commande")}
          `,
        }),
        text: `${info.isRenewal ? "Renouvellement" : "Nouvelle commande"}\nClient : ${info.customerName} <${info.customerEmail}>\nOffre : ${info.title} — ${formatPrice(info.priceCents)}\n\n${site}/admin/commandes`,
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
    const site = await appOrigin();
    await sendEmail({
      to: info.customerEmail,
      subject: "Votre abonnement NexoraTV est actif",
      html: renderEmail({
        preheader: `${info.subscriptionLabel} — vos identifiants sont disponibles.`,
        title: "Votre abonnement est activé 🎉",
        siteUrl: site,
        bodyHtml: `
          ${p(`Bonjour ${escapeHtml(info.customerName)},`)}
          ${p(`Bonne nouvelle : votre ${info.isRenewal ? "renouvellement" : "abonnement"} <strong>${escapeHtml(info.subscriptionLabel)}</strong> est activé.`)}
          ${p("Vos identifiants de connexion sont disponibles dans votre espace client.")}
          ${emailButton(`${site}/profil`, "Voir mes identifiants")}
          ${p(`<span style="color:#828aa0;font-size:13px">Besoin d'aide pour l'installation ? Consultez le <a href="${site}/tuto" style="color:#7fb0f5">tutoriel</a>.</span>`)}
        `,
      }),
      text: `Bonjour ${info.customerName},\n\nVotre ${info.isRenewal ? "renouvellement" : "abonnement"} "${info.subscriptionLabel}" est activé.\nVos identifiants : ${site}/profil`,
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
    const site = await appOrigin();
    await sendEmail({
      to: info.customerEmail,
      subject: "Votre commande NexoraTV n'a pas pu être validée",
      html: renderEmail({
        preheader: `${info.title} — aucun montant prélevé.`,
        title: "Votre commande n'a pas pu être validée",
        siteUrl: site,
        bodyHtml: `
          ${p(`Bonjour ${escapeHtml(info.customerName)},`)}
          ${p(`Votre commande <strong>${escapeHtml(info.title)}</strong> n'a pas pu être validée.`)}
          ${info.reason ? `<p style="margin:0 0 6px;font-size:13px;color:#828aa0">Motif</p>${noteBox(escapeHtml(info.reason))}` : ""}
          ${p("Aucun montant n'a été prélevé. Pour toute question, répondez à cet e-mail ou passez par la page contact.")}
          ${emailButton(`${site}/contact`, "Nous contacter")}
        `,
      }),
      text: `Bonjour ${info.customerName},\n\nVotre commande "${info.title}" n'a pas pu être validée.${info.reason ? `\nMotif : ${info.reason}` : ""}\nAucun montant n'a été prélevé.\n\nContact : ${site}/contact`,
    });
  } catch (err) {
    console.error("[order-mail] client 'refusée' échec", err);
  }
}
