"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordResetAction } from "@/actions/auth-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import type { FormState } from "@/lib/types";

const initial: FormState = {};

export default function ForgotForm() {
  const [state, action] = useActionState(requestPasswordResetAction, initial);

  if (state.ok) {
    return (
      <>
        <div className="flash flash-success">
          Si un compte est associé à cette adresse, un e-mail contenant un lien
          de réinitialisation vient d&apos;être envoyé. Pensez à vérifier vos
          spams — le lien est valable 30 minutes.
        </div>
        <p className="auth-switch">
          <Link href="/connexion">Retour à la connexion</Link>
        </p>
      </>
    );
  }

  return (
    <>
      <FormErrors state={state} />
      <form action={action} noValidate>
        <div className="form-group">
          <label htmlFor="email">Adresse e-mail</label>
          <input
            className="input"
            type="email"
            id="email"
            name="email"
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        {/* Honeypot anti-bot */}
        <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
          <label>
            Ne pas remplir
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <SubmitButton className="btn btn-primary btn-block">
          Envoyer le lien
        </SubmitButton>
      </form>
      <p className="auth-switch">
        <Link href="/connexion">Retour à la connexion</Link>
      </p>
    </>
  );
}
