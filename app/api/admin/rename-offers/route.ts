import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Route temporaire, à supprimer après exécution : renomme les offres « ligne ».
 *   - 1 écran : nom selon la durée (Découverte / Start / Plus / Extra / Infinity)
 *   - packs multi-écrans : nom selon le nombre d'écrans, identique quelle que
 *     soit la durée (Standard / Premium / Ultra)
 * Sans paramètre : aperçu, rien n'est modifié. Avec ?apply=1 : applique.
 */

type Row = {
  id: number;
  title: string;
  duration_label: string;
  included_screens: number;
  active: boolean;
};

/** Durée en mois à partir du libellé (« 24h », « 1 mois », « 2 ans »…) ; 0 = essai. */
function durationMonths(label: string): number | null {
  const s = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (s.includes("essai")) return 0;
  const m = s.match(/(\d+)\s*(h|heure|j|jour|semaine|mois|an|annee)/);
  if (!m) return null;
  const n = Number(m[1]);
  switch (m[2]) {
    case "h":
    case "heure":
    case "j":
    case "jour":
    case "semaine":
      return 0;
    case "mois":
      return n;
    default:
      return n * 12;
  }
}

function newTitle(o: Row): string | null {
  if (o.included_screens > 1) {
    if (o.included_screens === 2) return "Standard";
    if (o.included_screens === 3) return "Premium";
    return "Ultra";
  }
  const months = durationMonths(o.duration_label);
  if (months === null) return null;
  if (months === 0) return "Découverte";
  if (months === 1) return "Start";
  if (months === 3) return "Plus";
  if (months === 6) return "Extra";
  if (months >= 12) return "Infinity";
  return null;
}

export async function GET(req: Request): Promise<Response> {
  await requireAdmin();
  const apply = new URL(req.url).searchParams.get("apply") === "1";

  const offers = (await sql`
    SELECT id, title, duration_label, included_screens, active
    FROM iptv_offers WHERE kind = 'line'
    ORDER BY included_screens, sort, id
  `) as unknown as Row[];

  const changes: string[] = [];
  const ignored: string[] = [];

  for (const o of offers) {
    const label = `#${o.id} ${o.duration_label} · ${o.included_screens} écran(s)${o.active ? "" : " (inactive)"}`;
    const title = newTitle(o);
    if (!title) {
      ignored.push(`${label} : « ${o.title} » (durée non reconnue)`);
      continue;
    }
    if (title === o.title) continue;
    changes.push(`${label} : « ${o.title} » → « ${title} »`);
    if (apply) await sql`UPDATE iptv_offers SET title = ${title} WHERE id = ${o.id}`;
  }

  return Response.json({
    mode: apply ? "appliqué" : "aperçu (ajoutez ?apply=1 pour appliquer)",
    changes,
    ignored,
  });
}
