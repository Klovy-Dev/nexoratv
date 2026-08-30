"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createOrderAction } from "@/actions/order-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import { formatPrice } from "@/lib/validation";
import { offerPriceCents, type FormState } from "@/lib/types";

const initial: FormState = {};

export interface OrderFormOffer {
  id: number;
  title: string;
  duration_label: string;
  kind: "line" | "mag" | "code";
  price_cents: number;
  included_screens: number;
  allow_screens: boolean;
  extra_screen_cents: number;
  max_screens: number;
}

export default function OrderForm({ offer }: { offer: OrderFormOffer }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createOrderAction, initial);
  const [screens, setScreens] = useState<number>(offer.included_screens || 1);

  const showScreens = offer.kind === "line" && offer.allow_screens;
  const total = useMemo(
    () => offerPriceCents(offer, showScreens ? screens : offer.included_screens),
    [offer, screens, showScreens],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const screenChoices: number[] = [];
  for (let n = offer.included_screens || 1; n <= (offer.max_screens || 5); n++) {
    screenChoices.push(n);
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={() => setOpen(true)}
      >
        Commander
      </button>

      {open && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Commander ${offer.title}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Fermer"
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            <h3 className="modal-title">{offer.title}</h3>
            <p className="muted" style={{ fontSize: "0.88rem", marginBottom: 18 }}>
              {offer.duration_label ? `${offer.duration_label} · ` : ""}
              {formatPrice(offer.price_cents)}
              {showScreens ? " (prix de base)" : ""}
            </p>

            <form action={action} className="stack">
              <FormErrors state={state} />
              <input type="hidden" name="offer_id" value={offer.id} />

              {showScreens && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="order-screens">Nombre d&apos;écrans</label>
                  <select
                    id="order-screens"
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
                    {formatPrice(offer.extra_screen_cents)} par écran
                    supplémentaire.
                  </p>
                </div>
              )}

              {offer.kind === "mag" && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="order-mac">Adresse MAC de votre boîtier</label>
                  <input
                    id="order-mac"
                    name="mac"
                    className="input"
                    placeholder="00:1A:79:XX:XX:XX"
                    autoComplete="off"
                  />
                  <p className="hint">
                    Dans les réglages réseau de votre boîtier MAG / Stalker.
                  </p>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="order-note">Message (optionnel)</label>
                <textarea
                  id="order-note"
                  name="customer_note"
                  className="textarea"
                  maxLength={500}
                  placeholder="Une précision pour l'équipe ?"
                  style={{ minHeight: 64 }}
                />
              </div>

              <div className="offer-total">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>

              <SubmitButton
                className="btn btn-primary btn-block"
                pendingLabel="Envoi…"
              >
                Confirmer la commande
              </SubmitButton>
              <p className="hint" style={{ textAlign: "center" }}>
                Sans paiement immédiat — l&apos;équipe valide puis active votre
                abonnement.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
