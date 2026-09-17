"use server";

import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { str } from "@/lib/validation";
import { notifyFeedbackWebhook } from "@/lib/discord-webhook";
import type { FormState } from "@/lib/types";

/**
 * Formulaire libre "avis & souhaits" (page /sondage, non liée dans la
 * navigation) : accessible sans compte, comme un Google Form.
 */
export async function submitFeedbackAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const honeypot = str(formData.get("website"));
  if (honeypot) return { ok: true };

  const ratingRaw = str(formData.get("rating"));
  const rating = ratingRaw ? Number(ratingRaw) : null;
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return { error: "Note invalide." };
  }

  const name = str(formData.get("name")).slice(0, 80);
  const email = str(formData.get("email")).slice(0, 120);
  const liked = str(formData.get("liked")).slice(0, 1000);
  const improve = str(formData.get("improve")).slice(0, 1000);
  const wanted = str(formData.get("wanted")).slice(0, 1000);

  if (!rating && !liked && !improve && !wanted) {
    return { error: "Répondez au moins à une question avant d'envoyer." };
  }

  const user = await getCurrentUser();

  await sql`
    INSERT INTO customer_feedback (user_id, name, email, rating, liked, improve, wanted)
    VALUES (${user?.id ?? null}, ${name || user?.name || ""}, ${email || user?.email || ""},
            ${rating}, ${liked}, ${improve}, ${wanted})
  `;

  const displayName = name || user?.name || "Anonyme";
  const parts: string[] = [];
  if (liked) parts.push(`**Apprécie :** ${liked}`);
  if (improve) parts.push(`**À améliorer :** ${improve}`);
  if (wanted) parts.push(`**Souhaits :** ${wanted}`);

  await notifyFeedbackWebhook({
    title: rating ? `${"⭐".repeat(rating)} Nouveau retour client` : "📝 Nouveau retour client",
    description: `**${displayName}**${email ? ` (${email})` : ""}\n${parts.join("\n") || "(pas de commentaire)"}`,
    color: 0x9b59b6,
  });

  return { ok: true };
}
