"use client";

import { useActionState } from "react";
import { updateUserInfoAction } from "@/actions/admin-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import type { FormState } from "@/lib/types";

const initial: FormState = {};

export default function EditUserForm({
  userId,
  name,
  email,
}: {
  userId: number;
  name: string;
  email: string;
}) {
  const [state, action] = useActionState(updateUserInfoAction, initial);

  return (
    <form action={action} className="grid-2" style={{ alignItems: "end" }}>
      <input type="hidden" name="user_id" value={userId} />
      <FormErrors state={state} />
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="eu-name">Nom</label>
        <input
          id="eu-name"
          name="name"
          className="input"
          defaultValue={name}
          maxLength={120}
        />
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="eu-email">E-mail</label>
        <input
          id="eu-email"
          name="email"
          type="email"
          className="input"
          defaultValue={email}
          maxLength={190}
        />
      </div>
      <div style={{ gridColumn: "1 / -1", marginTop: 4 }}>
        <SubmitButton className="btn btn-ghost btn-sm">
          Enregistrer nom / e-mail
        </SubmitButton>
      </div>
    </form>
  );
}
