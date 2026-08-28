"use server";

import { isEmail, str } from "@/lib/validation";
import type { FormState } from "@/lib/types";

export async function contactAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = str(formData.get("name"));
  const email = str(formData.get("email"));
  const subject = str(formData.get("subject"));
  const message = str(formData.get("message"));
  const honeypot = str(formData.get("website"));

  const errors: string[] = [];
  if (honeypot) errors.push("Requête invalide.");
  if (name.length < 2) errors.push("Merci d'indiquer votre nom.");
  if (!isEmail(email)) errors.push("Adresse e-mail invalide.");
  if (subject.length < 3) errors.push("Merci d'indiquer un objet.");
  if (message.length < 10) errors.push("Votre message est trop court.");

  if (errors.length > 0) return { fieldErrors: errors };

  // Pas de serveur d'e-mail ici : on trace la demande dans les logs.
  // Pour un envoi réel, branchez Resend / Postmark / SendGrid.
  console.log(
    `[contact] ${new Date().toISOString()} — ${name} <${email}> : ${subject}\n${message}`,
  );

  return { ok: true };
}
