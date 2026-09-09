"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { str } from "@/lib/validation";
import type { FormState } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Page Tuto — sections éditables depuis /admin/tuto                  */
/* ------------------------------------------------------------------ */

export async function saveTutoSectionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = Number(formData.get("id")) || null;
  const title = str(formData.get("title"));
  const icon = str(formData.get("icon")).slice(0, 8);
  const body = str(formData.get("body"));
  const sort = Number(formData.get("sort")) || 0;
  const published = formData.get("published") === "on";

  const errors: string[] = [];
  if (!title) errors.push("Le titre est obligatoire.");
  if (!body) errors.push("Le contenu est obligatoire.");
  if (errors.length > 0) return { fieldErrors: errors };

  if (id) {
    await sql`
      UPDATE tuto_sections SET
        title = ${title}, icon = ${icon}, body = ${body},
        sort = ${sort}, published = ${published}, updated_at = now()
      WHERE id = ${id}
    `;
  } else {
    await sql`
      INSERT INTO tuto_sections (title, icon, body, sort, published)
      VALUES (${title}, ${icon}, ${body}, ${sort}, ${published})
    `;
  }

  revalidatePath("/admin/tuto");
  revalidatePath("/tuto");
  redirect("/admin/tuto?ok=1");
}

export async function deleteTutoSectionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id")) || 0;
  await sql`DELETE FROM tuto_sections WHERE id = ${id}`;
  revalidatePath("/admin/tuto");
  revalidatePath("/tuto");
  redirect("/admin/tuto?ok=del");
}
