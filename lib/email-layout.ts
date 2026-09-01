import "server-only";

/**
 * Gabarit HTML commun à tous les e-mails NexoraTV.
 *
 * Contraintes des clients mail (Gmail, Outlook, Apple Mail…) :
 *  - pas de CSS externe, styles inline uniquement, mise en page en <table>
 *  - fond sombre géré par un <table> plein écran (les <body> sont peu fiables)
 *  - bouton « bulletproof » avec repli VML pour Outlook Windows
 */

const C = {
  bg: "#05060a",
  card: "#12141c",
  border: "#242836",
  text: "#c8ccd8",
  heading: "#f1f2f7",
  muted: "#828aa0",
  pink: "#ff2e9a",
  grad: "linear-gradient(120deg,#ff2e9a 0%,#a13bd8 50%,#2f80ed 100%)",
  solid: "#a13bd8",
};

export function escapeHtml(s: string): string {
  return String(s).replace(
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

/** Bouton d'action compatible Outlook. `label` et `href` doivent être sûrs. */
export function emailButton(href: string, label: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0">
    <tr><td>
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
        href="${href}" style="height:46px;v-text-anchor:middle;width:280px;" arcsize="22%"
        strokecolor="${C.solid}" fillcolor="${C.solid}">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:Segoe UI,Arial,sans-serif;font-size:15px;font-weight:bold;">${label}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${href}" style="background:${C.grad};background-color:${C.solid};border-radius:10px;color:#ffffff;display:inline-block;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;line-height:46px;padding:0 30px;text-align:center;text-decoration:none">${label}</a>
      <!--<![endif]-->
    </td></tr>
  </table>`;
}

/** Tableau clé / valeur. Les valeurs sont échappées ici. */
export function infoTable(rows: [string, string][]): string {
  const body = rows
    .map(
      ([k, v], i) => `
      <tr>
        <td style="padding:10px 0;border-top:${i ? `1px solid ${C.border}` : "0"};color:${C.muted};font-size:13px">${escapeHtml(k)}</td>
        <td style="padding:10px 0;border-top:${i ? `1px solid ${C.border}` : "0"};color:${C.heading};font-size:14px;font-weight:600;text-align:right">${escapeHtml(v)}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 4px">${body}</table>`;
}

/** Encadré (motif de refus, mise en garde…). `html` doit être déjà sûr. */
export function noteBox(html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px">
    <tr><td style="background:#1b1f2b;border-left:3px solid ${C.pink};border-radius:8px;padding:14px 16px;color:${C.text};font-size:14px">${html}</td></tr>
  </table>`;
}

export interface EmailOpts {
  /** texte d'aperçu (masqué), affiché dans la liste des messages */
  preheader: string;
  /** titre principal dans le corps */
  title: string;
  /** contenu HTML déjà assaini (paragraphes, tables, boutons…) */
  bodyHtml: string;
  /** URL publique du site (pour l'en-tête et le pied de page) */
  siteUrl: string;
}

export function renderEmail(o: EmailOpts): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="fr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<title>${escapeHtml(o.title)}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 12px">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:${C.card};border:1px solid ${C.border};border-radius:16px;overflow:hidden;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif">
        <tr>
          <td style="padding:26px 32px 0">
            <a href="${o.siteUrl}" style="color:${C.heading};font-size:20px;font-weight:800;text-decoration:none;letter-spacing:-.01em">Nexora<span style="color:${C.pink}">TV</span></a>
          </td>
        </tr>
        <tr><td style="padding:16px 32px 0"><div style="height:3px;border-radius:3px;background:${C.grad}"></div></td></tr>
        <tr>
          <td style="padding:24px 32px 32px;color:${C.text};font-size:15px;line-height:1.65">
            <h1 style="margin:0 0 16px;color:${C.heading};font-size:20px;line-height:1.3">${escapeHtml(o.title)}</h1>
            ${o.bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 26px;border-top:1px solid ${C.border};color:${C.muted};font-size:12px;line-height:1.6">
            <a href="${o.siteUrl}" style="color:${C.muted};text-decoration:none">nexoratv.fr</a>
            &nbsp;·&nbsp;
            <a href="${o.siteUrl}/contact" style="color:${C.muted};text-decoration:none">Contact</a>
            &nbsp;·&nbsp;
            <a href="${o.siteUrl}/tuto" style="color:${C.muted};text-decoration:none">Aide</a>
            <br>
            © ${year} NexoraTV — cet e-mail vous est envoyé suite à une action sur votre compte.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Raccourci pour un paragraphe de corps de mail. */
export function p(html: string): string {
  return `<p style="margin:0 0 16px">${html}</p>`;
}

export const emailColors = C;
