"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { str } from "@/lib/validation";
import type { FormState, ProviderKind } from "@/lib/types";

const KINDS: ProviderKind[] = ["line", "mag", "code"];

/** Prix « 12,90 » ou « 12.90 » ou « 13 » → centimes. */
function priceToCents(raw: string): number | null {
  const normalized = raw.replace(",", ".").replace(/[^\d.]/g, "");
  if (!normalized) return 0;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0 || value > 100000) return null;
  return Math.round(value * 100);
}

/**
 * Palier de prix écran optionnel : champ vide → `null` (hérite du palier
 * précédent, cf. offerPriceCents) ; valeur non vide invalide → `undefined`
 * (erreur de validation) ; sinon centimes.
 */
function priceToCentsOrNull(raw: string): number | null | undefined {
  if (!raw.trim()) return null;
  const normalized = raw.replace(",", ".").replace(/[^\d.]/g, "");
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0 || value > 100000) return undefined;
  return Math.round(value * 100);
}

export async function saveOfferAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const offerId = Number(formData.get("offer_id")) || null;
  const kindRaw = str(formData.get("kind")) as ProviderKind;
  const kind = KINDS.includes(kindRaw) ? kindRaw : "line";
  const packageId = Number(formData.get("goldenott_package_id")) || 0;
  const templateRaw = str(formData.get("goldenott_template_id"));
  const templateId = templateRaw ? Number(templateRaw) : null;
  const domainRaw = str(formData.get("dns_domain_id"));
  const dnsDomainId = domainRaw ? Number(domainRaw) : null;
  const title = str(formData.get("title"));
  const tagline = str(formData.get("tagline"));
  const durationLabel = str(formData.get("duration_label"));
  const badge = str(formData.get("badge")).slice(0, 24);
  const priceCents = priceToCents(str(formData.get("price")));
  const isAdult = formData.get("is_adult") === "on";
  const active = formData.get("active") === "on";
  const sort = Number(formData.get("sort")) || 0;

  const includedScreens = Math.min(5, Math.max(1, Number(formData.get("included_screens")) || 1));
  const allowScreens = formData.get("allow_screens") === "on" && kind === "line";
  const maxScreens = Math.min(
    5,
    Math.max(includedScreens, Number(formData.get("max_screens")) || 5),
  );
  const extraScreenCents = priceToCents(str(formData.get("extra_screen_price"))) ?? 300;
  const compareAt = priceToCentsOrNull(str(formData.get("compare_at_price")));
  const tier2 = priceToCentsOrNull(str(formData.get("extra_screen_price_2")));
  const tier3 = priceToCentsOrNull(str(formData.get("extra_screen_price_3")));
  const tier4 = priceToCentsOrNull(str(formData.get("extra_screen_price_4")));

  const errors: string[] = [];
  if (!packageId) errors.push("Sélectionnez un forfait GoldenOTT.");
  if (!title) errors.push("Le titre commercial est requis.");
  if (priceCents === null) errors.push("Prix invalide.");
  if (compareAt === undefined) errors.push("Prix barré invalide.");
  if (compareAt != null && priceCents != null && compareAt <= priceCents) {
    errors.push("Le prix barré doit être supérieur au prix de vente.");
  }
  if (tier2 === undefined) errors.push("Prix du 2e écran supplémentaire invalide.");
  if (tier3 === undefined) errors.push("Prix du 3e écran supplémentaire invalide.");
  if (tier4 === undefined) errors.push("Prix du 4e écran supplémentaire invalide.");
  if (errors.length > 0) return { fieldErrors: errors };

  const compareAtCents = compareAt ?? null;
  const extraScreenCents2 = tier2 ?? null;
  const extraScreenCents3 = tier3 ?? null;
  const extraScreenCents4 = tier4 ?? null;

  if (offerId) {
    await sql`
      UPDATE iptv_offers SET
        kind = ${kind}, goldenott_package_id = ${packageId},
        goldenott_template_id = ${templateId}, dns_domain_id = ${dnsDomainId},
        title = ${title},
        tagline = ${tagline}, duration_label = ${durationLabel}, badge = ${badge},
        price_cents = ${priceCents}, max_connections = ${includedScreens},
        included_screens = ${includedScreens}, allow_screens = ${allowScreens},
        extra_screen_cents = ${extraScreenCents}, max_screens = ${maxScreens},
        extra_screen_cents_2 = ${extraScreenCents2}, extra_screen_cents_3 = ${extraScreenCents3},
        extra_screen_cents_4 = ${extraScreenCents4}, compare_at_cents = ${compareAtCents},
        is_adult = ${isAdult}, active = ${active}, sort = ${sort}
      WHERE id = ${offerId}
    `;
  } else {
    await sql`
      INSERT INTO iptv_offers
        (kind, goldenott_package_id, goldenott_template_id, dns_domain_id, title,
         tagline, duration_label, badge, price_cents, max_connections,
         included_screens, allow_screens, extra_screen_cents, max_screens,
         extra_screen_cents_2, extra_screen_cents_3, extra_screen_cents_4, compare_at_cents,
         is_adult, active, sort)
      VALUES
        (${kind}, ${packageId}, ${templateId}, ${dnsDomainId}, ${title}, ${tagline},
         ${durationLabel}, ${badge}, ${priceCents}, ${includedScreens}, ${includedScreens},
         ${allowScreens}, ${extraScreenCents}, ${maxScreens},
         ${extraScreenCents2}, ${extraScreenCents3}, ${extraScreenCents4}, ${compareAtCents},
         ${isAdult}, ${active}, ${sort})
    `;
  }

  revalidatePath("/admin/offres");
  revalidatePath("/commander");
  redirect("/admin/offres?ok=1");
}

export async function deleteOfferAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const offerId = Number(formData.get("offer_id")) || 0;
  await sql`DELETE FROM iptv_offers WHERE id = ${offerId}`;
  revalidatePath("/admin/offres");
  revalidatePath("/commander");
  redirect("/admin/offres?ok=1");
}

export async function toggleOfferAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const offerId = Number(formData.get("offer_id")) || 0;
  await sql`UPDATE iptv_offers SET active = NOT active WHERE id = ${offerId}`;
  revalidatePath("/admin/offres");
  revalidatePath("/commander");
  redirect("/admin/offres?ok=1");
}
