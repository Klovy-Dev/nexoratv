"use client";

import { useActionState } from "react";
import { contactAction } from "@/actions/contact-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import type { FormState } from "@/lib/types";

const initial: FormState = {};

export default function ContactForm({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const [state, action] = useActionState(contactAction, initial);

  if (state.ok) {
    return (
      <div className="flash flash-success">
        Message envoyé. Nous revenons vers vous rapidement.
      </div>
    );
  }

  return (
    <>
      <FormErrors state={state} />
      <form action={action} noValidate>
        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="name">Nom</label>
            <input
              className="input"
              id="name"
              name="name"
              defaultValue={defaultName}
              required
              maxLength={80}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              className="input"
              type="email"
              id="email"
              name="email"
              defaultValue={defaultEmail}
              required
              maxLength={120}
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="subject">Objet</label>
          <input
            className="input"
            id="subject"
            name="subject"
            required
            maxLength={120}
          />
        </div>
        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea
            className="textarea"
            id="message"
            name="message"
            required
            maxLength={2000}
            style={{ minHeight: 140 }}
          />
        </div>
        <div
          style={{ position: "absolute", left: "-9999px" }}
          aria-hidden="true"
        >
          <label>
            Ne pas remplir
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <SubmitButton className="btn btn-primary btn-block">
          Envoyer le message
        </SubmitButton>
      </form>
    </>
  );
}
