import "server-only";
import { appOrigin, sendEmail } from "@/lib/mail";
import {
  emailButton,
  escapeHtml,
  infoTable,
  p,
  renderEmail,
} from "@/lib/email-layout";
import {
  claimExpiryReminder,
  releaseExpiryReminder,
  subscriptionsDueForExpiryReminder,
  type ExpiryReminderKind,
  type ExpiryReminderTarget,
} from "@/lib/data";

/**
 * Rappels d'échéance envoyés par le cron quotidien
 * (`/api/cron/expiry-reminders`) : un premier à J-5, un dernier à J-1.
 * Chaque rappel est réservé en base avant l'envoi (jamais de doublon) et
 * libéré si Resend échoue, pour être retenté le lendemain.
 */

/** Resend (offre gratuite) limite à 2 requêtes / seconde. */
const SEND_GAP_MS = 600;

function longDate(isoDay: string): string {
  const d = new Date(`${isoDay}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDay;
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function whenLabel(daysLeft: number): string {
  if (daysLeft <= 0) return "aujourd'hui";
  if (daysLeft === 1) return "demain";
  return `dans ${daysLeft} jours`;
}

async function sendExpiryReminderEmail(
  t: ExpiryReminderTarget,
  kind: ExpiryReminderKind,
  site: string,
): Promise<void> {
  const when = whenLabel(t.daysLeft);
  const date = longDate(t.expiresAt);
  const last = kind === "j1";

  const subject = last
    ? `Dernier rappel : votre abonnement NexoraTV expire ${when}`
    : `Votre abonnement NexoraTV expire ${when}`;

  await sendEmail({
    to: t.userEmail,
    subject,
    html: renderEmail({
      preheader: `${t.label} — échéance le ${date}.`,
      title: last
        ? `Votre abonnement expire ${when} ⏳`
        : `Votre abonnement expire ${when}`,
      siteUrl: site,
      bodyHtml: `
        ${p(`Bonjour ${escapeHtml(t.userName)},`)}
        ${p(`Votre abonnement <strong>${escapeHtml(t.label)}</strong> arrive à échéance ${when}, le <strong>${escapeHtml(date)}</strong>.`)}
        ${infoTable([
          ["Abonnement", t.label],
          ["Échéance", date],
        ])}
        ${p(
          last
            ? "Renouvelez dès maintenant pour éviter toute coupure de service."
            : "Pensez à le renouveler pour continuer à profiter de vos chaînes sans interruption.",
        )}
        ${emailButton(`${site}/commander`, "Renouveler mon abonnement")}
        ${p(`<span style="color:#828aa0;font-size:13px">Déjà renouvelé ? Ignorez ce message. Une question : <a href="${site}/contact" style="color:#7fb0f5">contactez-nous</a>.</span>`)}
      `,
    }),
    text:
      `Bonjour ${t.userName},\n\n` +
      `Votre abonnement "${t.label}" arrive à échéance ${when}, le ${date}.\n` +
      `${last ? "Renouvelez dès maintenant pour éviter toute coupure." : "Pensez à le renouveler pour éviter toute interruption."}\n\n` +
      `Renouveler : ${site}/commander\n` +
      `Déjà renouvelé ? Ignorez ce message.`,
  });
}

export interface ExpiryReminderReport {
  sent: number;
  failed: number;
  skipped: number;
}

export async function sendDueExpiryReminders(): Promise<
  Record<ExpiryReminderKind, ExpiryReminderReport>
> {
  const site = await appOrigin();
  const report = {} as Record<ExpiryReminderKind, ExpiryReminderReport>;

  for (const kind of ["j1", "j5"] as const) {
    const r: ExpiryReminderReport = { sent: 0, failed: 0, skipped: 0 };
    report[kind] = r;

    for (const t of await subscriptionsDueForExpiryReminder(kind)) {
      if (!(await claimExpiryReminder(t.subscriptionId, t.expiresAt, kind))) {
        r.skipped++;
        continue;
      }
      try {
        await sendExpiryReminderEmail(t, kind, site);
        r.sent++;
      } catch (err) {
        r.failed++;
        console.error(`[expiry-mail] ${kind} sub #${t.subscriptionId}`, err);
        await releaseExpiryReminder(t.subscriptionId, t.expiresAt, kind).catch(
          () => {},
        );
      }
      await new Promise((res) => setTimeout(res, SEND_GAP_MS));
    }
  }

  return report;
}
