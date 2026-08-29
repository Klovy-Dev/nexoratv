"use client";

import { useActionState } from "react";
import { submitReviewAction, deleteReviewAction } from "@/actions/review-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import StarRatingInput from "@/components/StarRatingInput";
import type { FormState } from "@/lib/types";

const initial: FormState = {};

export default function ReviewForm({
  existing,
}: {
  existing: { rating: number; body: string } | null;
}) {
  const [state, action] = useActionState(submitReviewAction, initial);

  return (
    <div className="panel reveal" style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: "1.15rem" }}>
        {existing ? "Modifier mon avis" : "Laisser un avis"}
      </h2>

      {state.ok && (
        <div className="flash flash-success" style={{ marginBottom: 16 }}>
          Merci, votre avis a été publié.
        </div>
      )}
      <FormErrors state={state} />

      <form action={action}>
        <div className="form-group">
          <label>Votre note</label>
          <StarRatingInput defaultValue={existing?.rating ?? 5} />
        </div>
        <div className="form-group">
          <label htmlFor="review-body">Votre avis</label>
          <textarea
            className="textarea"
            id="review-body"
            name="body"
            rows={4}
            maxLength={1000}
            minLength={10}
            defaultValue={existing?.body}
            placeholder="Partagez votre expérience avec NexoraTV…"
            required
          />
        </div>
        <SubmitButton className="btn btn-primary">
          {existing ? "Mettre à jour mon avis" : "Publier mon avis"}
        </SubmitButton>
      </form>

      {existing && (
        <form action={deleteReviewAction} className="inline-form" style={{ marginTop: 12 }}>
          <ConfirmSubmit className="btn btn-ghost btn-sm" confirm="Supprimer votre avis ?">
            Supprimer mon avis
          </ConfirmSubmit>
        </form>
      )}
    </div>
  );
}
