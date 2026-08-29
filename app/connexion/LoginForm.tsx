"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/actions/auth-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import PasswordInput from "@/components/PasswordInput";
import type { FormState } from "@/lib/types";

const initial: FormState = {};

export default function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, initial);

  return (
    <>
      <FormErrors state={state} />
      <form action={action} noValidate>
        {next && <input type="hidden" name="next" value={next} />}
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
        <div className="form-group">
          <div className="label-row">
            <label htmlFor="password">Mot de passe</label>
            <Link href="/mot-de-passe-oublie" className="label-link">
              Mot de passe oublié ?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </div>
        <SubmitButton className="btn btn-primary btn-block">
          Se connecter
        </SubmitButton>
      </form>
      <p className="auth-switch">
        Pas encore de compte ? <Link href="/inscription">Créer un compte</Link>
      </p>
    </>
  );
}
