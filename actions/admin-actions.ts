"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { subscriptionById } from "@/lib/data";
import { str } from "@/lib/validation";
import type { FormState } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Ajout / modification d'un abonnement                               */
/* ------------------------------------------------------------------ */

export async function saveSubscriptionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const subId = Number(formData.get("sub_id")) || null;
  const userId = Number(formData.get("user_id")) || 0;
  const label = str(formData.get("label")) || "Abonnement";
  const serverUrl = str(formData.get("server_url"));
  const username = str(formData.get("username"));
  const password = String(formData.get("password") ?? "");
  const expiresAt = str(formData.get("expires_at"));
  const status = formData.get("status") === "suspended" ? "suspended" : "active";
  const note = str(formData.get("note"));

  const errors: string[] = [];
  const target = (await sql`SELECT 1 FROM users WHERE id = ${userId}`) as unknown as unknown[];
  if (target.length === 0) errors.push("Client introuvable.");
  if (serverUrl && !/^https?:\/\//i.test(serverUrl)) {
    errors.push("L'URL du serveur doit commencer par http:// ou https://.");
  }
  if (expiresAt && !/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) {
    errors.push("Date d'expiration invalide (AAAA-MM-JJ).");
  }
  if (errors.length > 0) return { fieldErrors: errors };

  const expiry = expiresAt || null;

  if (subId) {
    // Mot de passe vide en édition => on conserve l'ancien.
    let passwordEnc: string;
    if (password === "") {
      const current = await subscriptionById(subId);
      passwordEnc = encryptSecret(current?.password ?? "");
    } else {
      passwordEnc = encryptSecret(password);
    }

    await sql`
      UPDATE subscriptions SET
        user_id = ${userId}, label = ${label}, server_url = ${serverUrl},
        username = ${username}, password_enc = ${passwordEnc},
        expires_at = ${expiry}, status = ${status}, note = ${note}
      WHERE id = ${subId}
    `;
  } else {
    await sql`
      INSERT INTO subscriptions
        (user_id, label, server_url, username, password_enc, expires_at, status, note)
      VALUES
        (${userId}, ${label}, ${serverUrl}, ${username}, ${encryptSecret(password)},
         ${expiry}, ${status}, ${note})
    `;
  }

  revalidatePath("/admin");
  redirect(`/admin?user=${userId}&ok=1`);
}

/* ------------------------------------------------------------------ */
/*  Actions simples (FormData brut)                                    */
/* ------------------------------------------------------------------ */

export async function deleteSubscriptionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const subId = Number(formData.get("sub_id")) || 0;
  const userId = Number(formData.get("user_id")) || 0;
  await sql`DELETE FROM subscriptions WHERE id = ${subId}`;
  revalidatePath("/admin");
  redirect(`/admin?user=${userId}&ok=1`);
}

export async function setRoleAction(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const userId = Number(formData.get("user_id")) || 0;
  const role = formData.get("role") === "admin" ? "admin" : "client";

  if (userId !== me.id) {
    await sql`UPDATE users SET role = ${role} WHERE id = ${userId}`;
  }
  revalidatePath("/admin");
  redirect(`/admin?user=${userId}&ok=1`);
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const userId = Number(formData.get("user_id")) || 0;

  if (userId === me.id) {
    redirect("/admin?err=self");
  }
  await sql`DELETE FROM users WHERE id = ${userId}`;
  revalidatePath("/admin");
  redirect("/admin?ok=1");
}
