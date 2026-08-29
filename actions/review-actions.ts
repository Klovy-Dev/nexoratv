"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { str } from "@/lib/validation";
import type { FormState } from "@/lib/types";

export async function submitReviewAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const rating = Number(formData.get("rating"));
  const body = str(formData.get("body"));

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Choisissez une note entre 1 et 5 étoiles." };
  }
  if (body.length < 10) {
    return { error: "Votre avis doit comporter au moins 10 caractères." };
  }
  if (body.length > 1000) {
    return { error: "Votre avis est trop long (1000 caractères maximum)." };
  }

  await sql`
    INSERT INTO reviews (user_id, rating, body)
    VALUES (${user.id}, ${rating}, ${body})
    ON CONFLICT (user_id) DO UPDATE
    SET rating = ${rating}, body = ${body}, created_at = now()
  `;

  revalidatePath("/avis");
  return { ok: true };
}

export async function deleteReviewAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  void formData;
  await sql`DELETE FROM reviews WHERE user_id = ${user.id}`;
  revalidatePath("/avis");
}
