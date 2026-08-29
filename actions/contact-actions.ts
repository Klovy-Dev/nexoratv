"use server";

import { isEmail, str } from "@/lib/validation";
import { sendEmail, contactEmailHtml } from "@/lib/mail";
import type { FormState } from "@/lib/types";

// Resend refuse d'envoyer vers une autre adresse tant qu'aucun domaine
// n'est vérifié (compte "testing" limité à l'adresse du compte Resend
// lui-même). Repasser sur nexoraa.hd@gmail.com une fois un domaine vérifié.
const CONTACT_TO = "klovy.off@gmail.com";

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

  try {
    await sendEmail({
      to: CONTACT_TO,
      subject: `[Contact NexoraTV] ${subject}`,
      html: contactEmailHtml(name, email, subject, message),
      text: `De : ${name} <${email}>\nObjet : ${subject}\n\n${message}`,
      replyTo: email,
    });
  } catch (err) {
    console.error("[contact] échec de l'envoi", err);
    return {
      error:
        "Votre message n'a pas pu être envoyé. Réessayez ou écrivez-nous directement à " +
        CONTACT_TO +
        ".",
    };
  }

  return { ok: true };
}
