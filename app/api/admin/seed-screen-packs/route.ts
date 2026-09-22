import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Route temporaire, à supprimer après exécution : crée les offres
 * Duo/Trio/Famille (2/3/5 écrans, prix fixe) pour chacune des 3 lignes de
 * base existantes (celles avec allow_screens=true), et désactive le
 * sélecteur d'écrans sur ces dernières (elles deviennent "Solo").
 * Protégée par requireAdmin(), comme toute route /api/admin/*.
 */

type Row = {
  id: number;
  title: string;
  tagline: string;
  duration_label: string;
  goldenott_package_id: number;
  goldenott_template_id: number | null;
  dns_domain_id: number | null;
  is_adult: boolean;
  sort: number;
};

const TABLES = [
  { duo: 7498, trio: 8797, famille: 11095 },
  { duo: 12998, trio: 15597, famille: 20195 },
  { duo: 17498, trio: 21397, famille: 28295 },
];

export async function GET(): Promise<Response> {
  await requireAdmin();

  const bases = (await sql`
    SELECT id, title, tagline, duration_label, goldenott_package_id,
           goldenott_template_id, dns_domain_id, is_adult, sort
    FROM iptv_offers
    WHERE kind = 'line' AND allow_screens = true AND price_cents > 0
    ORDER BY price_cents ASC
  `) as unknown as Row[];

  if (bases.length !== 3) {
    return Response.json(
      { error: `Attendu 3 offres de base (allow_screens=true), trouvé ${bases.length}.`, bases },
      { status: 400 },
    );
  }

  const created: string[] = [];
  for (let i = 0; i < 3; i++) {
    const base = bases[i];
    const { duo, trio, famille } = TABLES[i];
    const packs = [
      { label: "Duo", screens: 2, price: duo },
      { label: "Trio", screens: 3, price: trio },
      { label: "Famille", screens: 5, price: famille },
    ];
    for (const p of packs) {
      await sql`
        INSERT INTO iptv_offers
          (kind, goldenott_package_id, goldenott_template_id, dns_domain_id, title,
           tagline, duration_label, badge, price_cents, max_connections,
           included_screens, allow_screens, extra_screen_cents, max_screens,
           is_adult, active, sort)
        VALUES
          ('line', ${base.goldenott_package_id}, ${base.goldenott_template_id}, ${base.dns_domain_id},
           ${`${base.title} — ${p.label}`}, ${base.tagline}, ${base.duration_label}, '',
           ${p.price}, ${p.screens}, ${p.screens}, false, 300, ${p.screens},
           ${base.is_adult}, true, ${base.sort})
      `;
      created.push(`${base.duration_label} ${p.label} = ${(p.price / 100).toFixed(2)} €`);
    }
    await sql`UPDATE iptv_offers SET allow_screens = false WHERE id = ${base.id}`;
  }

  return Response.json({ ok: true, created });
}
