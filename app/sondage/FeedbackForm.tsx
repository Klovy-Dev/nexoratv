"use client";

import { useActionState } from "react";
import { submitFeedbackAction } from "@/actions/feedback-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import StarRatingInput from "@/components/StarRatingInput";
import type { FormState } from "@/lib/types";

const initial: FormState = {};

export default function FeedbackForm({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const [state, action] = useActionState(submitFeedbackAction, initial);

  if (state.ok) {
    return (
      <div className="panel reveal">
        <div className="flash flash-success" style={{ margin: 0 }}>
          Merci beaucoup, votre retour a bien été envoyé à l&apos;équipe !
        </div>
      </div>
    );
  }

  return (
    <div className="panel reveal">
      <FormErrors state={state} />

      <form action={action}>
        <div className="form-group">
          <label>Votre satisfaction globale</label>
          <StarRatingInput defaultValue={3} />
        </div>

        <div className="form-group">
          <label htmlFor="fb-liked">Qu&apos;est-ce que vous appréciez le plus ?</label>
          <textarea
            id="fb-liked"
            name="liked"
            className="textarea"
            rows={3}
            maxLength={1000}
            placeholder="La fiabilité, le catalogue, le support…"
          />
        </div>

        <div className="form-group">
          <label htmlFor="fb-improve">Qu&apos;est-ce qu&apos;on pourrait améliorer ?</label>
          <textarea
            id="fb-improve"
            name="improve"
            className="textarea"
            rows={3}
            maxLength={1000}
            placeholder="Un bug qui revient, un temps de réponse trop long…"
          />
        </div>

        <div className="form-group">
          <label htmlFor="fb-wanted">
            Quelles fonctionnalités ou contenus aimeriez-vous voir ajoutés ?
          </label>
          <textarea
            id="fb-wanted"
            name="wanted"
            className="textarea"
            rows={3}
            maxLength={1000}
            placeholder="Une chaîne, une appli, une option en particulier…"
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="fb-name">Votre nom (optionnel)</label>
            <input
              id="fb-name"
              name="name"
              className="input"
              defaultValue={defaultName}
              maxLength={80}
              placeholder="Anonyme si vide"
            />
          </div>
          <div className="form-group">
            <label htmlFor="fb-email">E-mail (optionnel)</label>
            <input
              id="fb-email"
              name="email"
              type="email"
              className="input"
              defaultValue={defaultEmail}
              maxLength={120}
              placeholder="Pour être recontacté"
            />
          </div>
        </div>

        {/* Honeypot anti-bot */}
        <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
          <label>
            Ne pas remplir
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <SubmitButton className="btn btn-primary btn-block">
          Envoyer mon avis
        </SubmitButton>
      </form>
    </div>
  );
}
