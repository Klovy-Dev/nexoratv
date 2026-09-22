"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { str } from "@/lib/validation";
import type { FormState } from "@/lib/types";

/** Prix « 12,90 » ou « 12.90 » ou « 13 » → centimes. */
function priceToCents(raw: string): number | null {
  const normalized = raw.replace(",", ".").replace(/[^\d.]/g, "");
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0 || value > 1000000) return null;
  return Math.round(value * 100);
}

/** Quantité de crédits « 5 », « 5,5 » ou « 5.5 » → nombre. */
function toCredits(raw: string): number | null {
  const normalized = raw.replace(",", ".").replace(/[^\d.]/g, "");
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0 || value > 100000) return null;
  return value;
}

export async function saveCreditPurchaseAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const id = Number(formData.get("id")) || null;
  const purchasedAt = str(formData.get("purchased_at"));
  const credits = toCredits(str(formData.get("credits")));
  const totalPriceCents = priceToCents(str(formData.get("total_price")));
  const note = str(formData.get("note"));

  const errors: string[] = [];
  if (!purchasedAt) errors.push("La date d'achat est obligatoire.");
  if (credits === null) errors.push("Le nombre de crédits doit être un nombre positif.");
  if (totalPriceCents === null) errors.push("Le prix payé doit être un nombre positif.");
  if (errors.length > 0) return { fieldErrors: errors };

  if (id) {
    await sql`
      UPDATE credit_purchases SET
        purchased_at = ${purchasedAt}, credits = ${credits}, total_price_cents = ${totalPriceCents},
        note = ${note}
      WHERE id = ${id}
    `;
  } else {
    await sql`
      INSERT INTO credit_purchases (purchased_at, credits, total_price_cents, note, created_by)
      VALUES (${purchasedAt}, ${credits}, ${totalPriceCents}, ${note}, ${admin.id})
    `;
  }

  revalidatePath("/admin/comptabilite");
  revalidatePath("/admin/comptabilite/credits");
  redirect("/admin/comptabilite/credits?ok=1");
}

export async function deleteCreditPurchaseAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id")) || 0;
  await sql`DELETE FROM credit_purchases WHERE id = ${id}`;
  revalidatePath("/admin/comptabilite");
  revalidatePath("/admin/comptabilite/credits");
  redirect("/admin/comptabilite/credits?ok=del");
}
