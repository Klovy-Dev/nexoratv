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
  const title = str(formData.get("title"));
  const tagline = str(formData.get("tagline"));
  const durationLabel = str(formData.get("duration_label"));
  const priceCents = priceToCents(str(formData.get("price")));
  const maxRaw = str(formData.get("max_connections"));
  const maxConnections = maxRaw ? Number(maxRaw) : null;
  const isAdult = formData.get("is_adult") === "on";
  const active = formData.get("active") === "on";
  const sort = Number(formData.get("sort")) || 0;

  const errors: string[] = [];
  if (!packageId) errors.push("Sélectionnez un forfait GoldenOTT.");
  if (!title) errors.push("Le titre commercial est requis.");
  if (priceCents === null) errors.push("Prix invalide.");
  if (maxConnections !== null && (maxConnections < 1 || maxConnections > 5)) {
    errors.push("Connexions simultanées : entre 1 et 5.");
  }
  if (errors.length > 0) return { fieldErrors: errors };

  if (offerId) {
    await sql`
      UPDATE iptv_offers SET
        kind = ${kind}, goldenott_package_id = ${packageId},
        goldenott_template_id = ${templateId}, title = ${title},
        tagline = ${tagline}, duration_label = ${durationLabel},
        price_cents = ${priceCents}, max_connections = ${maxConnections},
        is_adult = ${isAdult}, active = ${active}, sort = ${sort}
      WHERE id = ${offerId}
    `;
  } else {
    await sql`
      INSERT INTO iptv_offers
        (kind, goldenott_package_id, goldenott_template_id, title, tagline,
         duration_label, price_cents, max_connections, is_adult, active, sort)
      VALUES
        (${kind}, ${packageId}, ${templateId}, ${title}, ${tagline},
         ${durationLabel}, ${priceCents}, ${maxConnections}, ${isAdult},
         ${active}, ${sort})
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
