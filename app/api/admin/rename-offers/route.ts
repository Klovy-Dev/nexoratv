import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Route temporaire, à supprimer après exécution : renomme les formules
 * multi-écrans selon le nombre d'écrans (Essentiel / Confort / Premium /
 * Famille). La durée reste portée par duration_label, affichée à part sur
 * la carte. Les offres courtes (essai, 1 mois, 3 mois) ne sont pas touchées.
 */

const NAMES: { screens: number; name: string }[] = [
  { screens: 2, name: "Confort" },
  { screens: 3, name: "Premium" },
  { screens: 5, name: "Famille" },
];

export async function GET(): Promise<Response> {
  await requireAdmin();

  const renamed: string[] = [];

  for (const { screens, name } of NAMES) {
    const rows = (await sql`
      UPDATE iptv_offers SET title = ${name}
      WHERE kind = 'line' AND included_screens = ${screens}
      RETURNING id, title, duration_label
    `) as unknown as { id: number; title: string; duration_label: string }[];
    for (const r of rows) renamed.push(`${r.duration_label} → ${r.title}`);
  }

  // « Essentiel » : les 3 lignes 1 écran longue durée, repérées par leur prix.
  const solo = (await sql`
    UPDATE iptv_offers SET title = 'Essentiel'
    WHERE kind = 'line' AND included_screens = 1 AND price_cents IN (5999, 9999, 12999)
    RETURNING id, title, duration_label
  `) as unknown as { id: number; title: string; duration_label: string }[];
  for (const r of solo) renamed.push(`${r.duration_label} → ${r.title}`);

  return Response.json({ ok: true, renamed });
}
