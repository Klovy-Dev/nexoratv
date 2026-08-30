"use client";

import { useActionState, useMemo, useState } from "react";
import { createOrderAction } from "@/actions/order-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import { formatPrice } from "@/lib/validation";
import { offerPriceCents, type FormState } from "@/lib/types";

const initial: FormState = {};

export interface OrderFormOffer {
  id: number;
  kind: "line" | "mag" | "code";
  price_cents: number;
  included_screens: number;
  allow_screens: boolean;
  extra_screen_cents: number;
  max_screens: number;
}

export default function OrderForm({ offer }: { offer: OrderFormOffer }) {
  const [state, action] = useActionState(createOrderAction, initial);
  const [screens, setScreens] = useState<number>(offer.included_screens || 1);

  const showScreens = offer.kind === "line" && offer.allow_screens;
  const total = useMemo(
    () => offerPriceCents(offer, showScreens ? screens : offer.included_screens),
    [offer, screens, showScreens],
  );

  const screenChoices: number[] = [];
  for (let n = offer.included_screens || 1; n <= (offer.max_screens || 5); n++) {
    screenChoices.push(n);
  }

  return (
    <form action={action} className="offer-order">
      <FormErrors state={state} />
      <input type="hidden" name="offer_id" value={offer.id} />

      {showScreens && (
        <div className="form-group">
          <label htmlFor={`screens-${offer.id}`}>Nombre d&apos;écrans</label>
          <select
            id={`screens-${offer.id}`}
            name="screens"
            className="select"
            value={screens}
            onChange={(e) => setScreens(Number(e.target.value))}
          >
            {screenChoices.map((n) => (
              <option key={n} value={n}>
                {n} écran{n > 1 ? "s" : ""}
                {n > (offer.included_screens || 1)
                  ? ` (+${formatPrice((n - (offer.included_screens || 1)) * offer.extra_screen_cents)})`
                  : ""}
              </option>
            ))}
          </select>
          <p className="hint">
            {formatPrice(offer.extra_screen_cents)} par écran supplémentaire.
          </p>
        </div>
      )}

      {offer.kind === "mag" && (
        <div className="form-group">
          <label htmlFor={`mac-${offer.id}`}>Adresse MAC de votre boîtier</label>
          <input
            id={`mac-${offer.id}`}
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
        <label htmlFor={`note-${offer.id}`}>Message (optionnel)</label>
        <textarea
          id={`note-${offer.id}`}
          name="customer_note"
          className="textarea"
          maxLength={500}
          placeholder="Une précision pour l'équipe ?"
          style={{ minHeight: 70 }}
        />
      </div>

      <div className="offer-total">
        <span>Total</span>
        <strong>{formatPrice(total)}</strong>
      </div>

      <SubmitButton className="btn btn-primary btn-block" pendingLabel="Envoi…">
        Commander
      </SubmitButton>
    </form>
  );
}
