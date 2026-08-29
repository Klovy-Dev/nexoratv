"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction } from "@/actions/auth-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import PasswordInput from "@/components/PasswordInput";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation";
import type { FormState } from "@/lib/types";

const initial: FormState = {};

export default function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, initial);

  return (
    <>
      <FormErrors state={state} />
      <form action={action} noValidate>
        <input type="hidden" name="token" value={token} />

        <div className="form-group">
          <label htmlFor="password">Nouveau mot de passe</label>
          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            autoFocus
            showStrength
          />
          <p className="hint">
            Au moins {PASSWORD_MIN_LENGTH} caractères, avec au minimum une lettre
            et un chiffre.
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="password_confirm">Confirmer le mot de passe</label>
          <PasswordInput
            id="password_confirm"
            name="password_confirm"
            required
            autoComplete="new-password"
          />
        </div>

        <SubmitButton className="btn btn-primary btn-block">
          Enregistrer le mot de passe
        </SubmitButton>
      </form>
      <p className="auth-switch">
        <Link href="/connexion">Retour à la connexion</Link>
      </p>
    </>
  );
}
