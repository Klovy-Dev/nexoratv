"use client";

import { useActionState, useMemo, useState } from "react";
import { createOrderAction } from "@/actions/order-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import { formatPrice } from "@/lib/validation";
import { offerPriceCents, type FormState } from "@/lib/types";
import { LockIcon } from "@/components/icons";

const initial: FormState = {};

export interface OrderStepOffer {
  id: number;
  title: string;
  kind: "line" | "mag" | "code";
  price_cents: number;
  included_screens: number;
  allow_screens: boolean;
  extra_screen_cents: number;
  max_screens: number;
  is_adult: boolean;
}

export default function OrderPageForm({
  offer,
  paypalEnabled,
}: {
  offer: OrderStepOffer;
  paypalEnabled: boolean;
}) {
  const [state, action] = useActionState(createOrderAction, initial);
  const [screens, setScreens] = useState<number>(offer.included_screens || 1);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");

  const showScreens = offer.kind === "line" && offer.allow_screens;
  const total = useMemo(
    () => offerPriceCents(offer, showScreens ? screens : offer.included_screens),
    [offer, screens, showScreens],
  );

  const screenChoices: number[] = [];
  for (let n = offer.included_screens || 1; n <= (offer.max_screens || 5); n++) {
    screenChoices.push(n);
  }

  const isFree = total <= 0;

  return (
    <form action={action} className="panel order-form">
      <h2>Votre commande</h2>
      <FormErrors state={state} />
      <input type="hidden" name="offer_id" value={offer.id} />

      <div className="order-options">
        {offer.is_adult ? (
          <label className="order-option">
            <input type="checkbox" name="no_adult" />
            <span>
              <strong>Exclure les chaînes adultes</strong>
              <small>
                Les bouquets adultes (18+) sont inclus par défaut — cochez
                pour un abonnement sans contenu adulte.
              </small>
            </span>
          </label>
        ) : (
          <label className="order-option">
            <input type="checkbox" name="want_adult" />
            <span>
              <strong>Inclure les chaînes adultes</strong>
              <small>Bouquets réservés aux adultes (18+).</small>
            </span>
          </label>
        )}
        <label className="order-option">
          <input type="checkbox" name="want_french" />
          <span>
            <strong>Uniquement le contenu français</strong>
            <small>
              Seulement les chaînes, films et séries en français.
            </small>
          </span>
        </label>
      </div>

      {showScreens && (
        <div className="form-group">
          <label htmlFor="order-screens">Nombre d&apos;écrans simultanés</label>
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
                  ? ` — +${formatPrice((n - (offer.included_screens || 1)) * offer.extra_screen_cents)}`
                  : " — inclus"}
              </option>
            ))}
          </select>
          <p className="hint">
            {formatPrice(offer.extra_screen_cents)} par écran au-delà de{" "}
            {offer.included_screens}.
          </p>
        </div>
      )}

      {offer.kind === "mag" && (
        <div className="form-group">
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

      <div className="form-group">
        <label htmlFor="order-note">Message pour l&apos;équipe (optionnel)</label>
        <textarea
          id="order-note"
          name="customer_note"
          className="textarea"
          maxLength={500}
          placeholder="Une précision, une question…"
        />
      </div>

      {paypalEnabled && !isFree && (
        <div className="form-group">
          <label>Moyen de paiement</label>
          <div className="order-options">
            <label className="order-option">
              <input
                type="radio"
                name="payment_method"
                value="stripe"
                checked={paymentMethod === "stripe"}
                onChange={() => setPaymentMethod("stripe")}
              />
              <span>
                <strong>Carte bancaire</strong>
                <small>Visa, Mastercard… via Stripe.</small>
              </span>
            </label>
            <label className="order-option">
              <input
                type="radio"
                name="payment_method"
                value="paypal"
                checked={paymentMethod === "paypal"}
                onChange={() => setPaymentMethod("paypal")}
              />
              <span>
                <strong>PayPal</strong>
                <small>Compte PayPal ou carte via PayPal.</small>
              </span>
            </label>
          </div>
        </div>
      )}

      <div className="order-total">
        <span>Total à régler</span>
        <strong>{formatPrice(total)}</strong>
      </div>

      {isFree ? (
        <>
          <SubmitButton
            className="btn btn-primary btn-block"
            pendingLabel="Activation en cours…"
          >
            Activer mon essai gratuit
          </SubmitButton>
          <p className="hint" style={{ textAlign: "center", marginTop: 8 }}>
            ✅ Aucun paiement requis — votre accès est activé immédiatement.
          </p>
        </>
      ) : (
        <>
          <SubmitButton
            className="btn btn-primary btn-block"
            pendingLabel={
              paymentMethod === "paypal" ? "Redirection vers PayPal…" : "Redirection vers Stripe…"
            }
          >
            Payer {formatPrice(total)} {paymentMethod === "paypal" ? "avec PayPal" : "avec Stripe"}
          </SubmitButton>
          <p
            className="hint"
            style={{ textAlign: "center", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <LockIcon size={14} /> Paiement sécurisé, traité par {paymentMethod === "paypal" ? "PayPal" : "Stripe"}.
          </p>
        </>
      )}
    </form>
  );
}
