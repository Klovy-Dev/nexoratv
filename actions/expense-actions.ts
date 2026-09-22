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

export async function saveExpenseAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const id = Number(formData.get("id")) || null;
  const expenseDate = str(formData.get("expense_date"));
  const label = str(formData.get("label"));
  const category = str(formData.get("category"));
  const amountCents = priceToCents(str(formData.get("amount")));
  const note = str(formData.get("note"));

  const errors: string[] = [];
  if (!expenseDate) errors.push("La date est obligatoire.");
  if (!label) errors.push("Le libellé est obligatoire.");
  if (amountCents === null) errors.push("Le montant doit être un nombre positif.");
  if (errors.length > 0) return { fieldErrors: errors };

  if (id) {
    await sql`
      UPDATE expenses SET
        expense_date = ${expenseDate}, label = ${label}, category = ${category},
        amount_cents = ${amountCents}, note = ${note}
      WHERE id = ${id}
    `;
  } else {
    await sql`
      INSERT INTO expenses (expense_date, label, category, amount_cents, note, created_by)
      VALUES (${expenseDate}, ${label}, ${category}, ${amountCents}, ${note}, ${admin.id})
    `;
  }

  revalidatePath("/admin/comptabilite");
  revalidatePath("/admin/comptabilite/depenses");
  redirect("/admin/comptabilite/depenses?ok=1");
}

export async function deleteExpenseAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id")) || 0;
  await sql`DELETE FROM expenses WHERE id = ${id}`;
  revalidatePath("/admin/comptabilite");
  revalidatePath("/admin/comptabilite/depenses");
  redirect("/admin/comptabilite/depenses?ok=del");
}
