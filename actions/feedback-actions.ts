"use server";

import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { str } from "@/lib/validation";
import { notifyFeedbackWebhook } from "@/lib/discord-webhook";
import type { FormState } from "@/lib/types";

/**
 * Formulaire libre "améliorations & souhaits" (page /sondage, non liée dans
 * la navigation) : accessible sans compte, comme un Google Form.
 */
export async function submitFeedbackAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const honeypot = str(formData.get("website"));
  if (honeypot) return { ok: true };

  const name = str(formData.get("name")).slice(0, 80);
  const email = str(formData.get("email")).slice(0, 120);
  const improve = str(formData.get("improve")).slice(0, 1000);
  const wanted = str(formData.get("wanted")).slice(0, 1000);

  if (!improve && !wanted) {
    return { error: "Répondez au moins à une question avant d'envoyer." };
  }

  const user = await getCurrentUser();

  await sql`
    INSERT INTO customer_feedback (user_id, name, email, improve, wanted)
    VALUES (${user?.id ?? null}, ${name || user?.name || ""}, ${email || user?.email || ""},
            ${improve}, ${wanted})
  `;

  const displayName = name || user?.name || "Anonyme";
  const parts: string[] = [];
  if (improve) parts.push(`**À améliorer :** ${improve}`);
  if (wanted) parts.push(`**Souhaits :** ${wanted}`);

  await notifyFeedbackWebhook({
    title: "📝 Nouveau retour client",
    description: `**${displayName}**${email ? ` (${email})` : ""}\n${parts.join("\n")}`,
    color: 0x9b59b6,
  });

  return { ok: true };
}
