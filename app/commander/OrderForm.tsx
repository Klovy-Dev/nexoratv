"use client";

import { useActionState } from "react";
import { createOrderAction } from "@/actions/order-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import type { FormState } from "@/lib/types";

const initial: FormState = {};

export default function OrderForm({
  offerId,
  kind,
}: {
  offerId: number;
  kind: "line" | "mag" | "code";
}) {
  const [state, action] = useActionState(createOrderAction, initial);

  return (
    <form action={action} className="offer-order">
      <FormErrors state={state} />
      <input type="hidden" name="offer_id" value={offerId} />

      {kind === "mag" && (
        <div className="form-group">
          <label htmlFor={`mac-${offerId}`}>Adresse MAC de votre boîtier</label>
          <input
            id={`mac-${offerId}`}
            name="mac"
            className="input"
            placeholder="00:1A:79:XX:XX:XX"
            autoComplete="off"
          />
          <p className="hint">
            Visible dans les réglages réseau de votre boîtier MAG / Stalker.
          </p>
        </div>
      )}

      <div className="form-group">
        <label htmlFor={`note-${offerId}`}>Message (optionnel)</label>
        <textarea
          id={`note-${offerId}`}
          name="customer_note"
          className="textarea"
          maxLength={500}
          placeholder="Une précision pour l'équipe ?"
          style={{ minHeight: 70 }}
        />
      </div>

      <SubmitButton className="btn btn-primary btn-block" pendingLabel="Envoi…">
        Commander
      </SubmitButton>
    </form>
  );
}
