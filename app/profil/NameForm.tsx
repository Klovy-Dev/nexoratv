"use client";

import { useActionState } from "react";
import { updateNameAction } from "@/actions/profile-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import type { FormState } from "@/lib/types";

const initial: FormState = {};

export default function NameForm({
  currentName,
  email,
}: {
  currentName: string;
  email: string;
}) {
  const [state, action] = useActionState(updateNameAction, initial);

  return (
    <div className="panel">
      <h2 style={{ fontSize: "1.15rem" }}>Informations</h2>
      {state.ok && (
        <div className="flash flash-success" style={{ marginBottom: 16 }}>
          Profil mis à jour.
        </div>
      )}
      <FormErrors state={state} />
      <form action={action}>
        <div className="form-group">
          <label htmlFor="pname">Nom complet</label>
          <input
            className="input"
            type="text"
            id="pname"
            name="name"
            defaultValue={currentName}
            maxLength={80}
            required
          />
        </div>
        <div className="form-group">
          <label>Adresse e-mail</label>
          <input className="input" type="email" value={email} disabled />
          <p className="hint">Pour changer d&apos;e-mail, contactez le support.</p>
        </div>
        <SubmitButton className="btn btn-primary btn-block">
          Enregistrer
        </SubmitButton>
      </form>
    </div>
  );
}
