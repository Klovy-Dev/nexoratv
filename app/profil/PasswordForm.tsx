"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/actions/profile-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import PasswordInput from "@/components/PasswordInput";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation";
import type { FormState } from "@/lib/types";

const initial: FormState = {};

export default function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, initial);

  return (
    <div className="panel">
      <h2 style={{ fontSize: "1.15rem" }}>Mot de passe</h2>
      {state.ok && (
        <div className="flash flash-success" style={{ marginBottom: 16 }}>
          Mot de passe modifié.
        </div>
      )}
      <FormErrors state={state} />
      <form action={action}>
        <div className="form-group">
          <label htmlFor="cur">Mot de passe actuel</label>
          <PasswordInput
            id="cur"
            name="current_password"
            autoComplete="current-password"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="np">Nouveau mot de passe</label>
          <PasswordInput
            id="np"
            name="new_password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="npc">Confirmer</label>
          <PasswordInput
            id="npc"
            name="new_password_confirm"
            autoComplete="new-password"
            required
          />
        </div>
        <SubmitButton className="btn btn-primary btn-block">
          Modifier le mot de passe
        </SubmitButton>
      </form>
    </div>
  );
}
