"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import {
  hashPassword,
  refreshSession,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { passwordProblems, str } from "@/lib/validation";
import type { FormState } from "@/lib/types";

export async function updateNameAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const name = str(formData.get("name"));

  if (name.length < 2) {
    return { error: "Le nom doit comporter au moins 2 caractères." };
  }

  await sql`UPDATE users SET name = ${name} WHERE id = ${user.id}`;
  // Réémet le cookie pour que l'en-tête reflète le nouveau nom sans requête DB.
  await refreshSession(user.id);
  revalidatePath("/profil");
  return { ok: true };
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("new_password_confirm") ?? "");

  const rows = (await sql`
    SELECT password_hash FROM users WHERE id = ${user.id}
  `) as unknown as { password_hash: string }[];

  const errors: string[] = [];
  if (!(await verifyPassword(current, rows[0].password_hash))) {
    errors.push("Mot de passe actuel incorrect.");
  }
  errors.push(...passwordProblems(next));
  if (next !== confirm) errors.push("La confirmation ne correspond pas.");

  if (errors.length > 0) return { fieldErrors: errors };

  const hash = await hashPassword(next);
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${user.id}`;
  return { ok: true };
}
