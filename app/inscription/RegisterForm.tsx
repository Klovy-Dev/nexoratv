"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/actions/auth-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import PasswordInput from "@/components/PasswordInput";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation";
import type { FormState } from "@/lib/types";

const initial: FormState = {};

export default function RegisterForm() {
  const [state, action] = useActionState(registerAction, initial);

  return (
    <>
      <FormErrors state={state} />
      <form action={action} noValidate>
        <div className="form-group">
          <label htmlFor="name">Nom complet</label>
          <input
            className="input"
            type="text"
            id="name"
            name="name"
            required
            autoComplete="name"
            maxLength={80}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Adresse e-mail</label>
          <input
            className="input"
            type="email"
            id="email"
            name="email"
            required
            autoComplete="email"
            maxLength={120}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Mot de passe</label>
          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
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

        <div
          className="form-group"
          style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
        >
          <input
            type="checkbox"
            id="accept"
            name="accept"
            style={{ marginTop: 5 }}
          />
          <label
            htmlFor="accept"
            style={{ fontWeight: 400, color: "var(--text-muted)" }}
          >
            J&apos;accepte les{" "}
            <Link href="/conditions">conditions d&apos;utilisation</Link> et la{" "}
            <Link href="/confidentialite">politique de confidentialité</Link>.
          </label>
        </div>

        {/* Honeypot anti-bot */}
        <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
          <label>
            Ne pas remplir
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <SubmitButton className="btn btn-primary btn-block">
          Créer mon compte
        </SubmitButton>
      </form>

      <p className="auth-switch">
        Déjà inscrit ? <Link href="/connexion">Se connecter</Link>
      </p>
    </>
  );
}
