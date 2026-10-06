"use client";

import { useActionState, useState } from "react";
import { createRenewalOrderAction } from "@/actions/order-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import { LockIcon } from "@/components/icons";
import { formatPrice } from "@/lib/validation";
import type { FormState } from "@/lib/types";

const initial: FormState = {};

export interface RenewOffer {
  id: number;
  title: string;
  duration_label: string;
  /** nombre d'écrans prolongés (ceux de l'abonnement) */
  screens: number;
  /** prix pour ce nombre d'écrans */
  total_cents: number;
}

type Method = "stripe" | "paypal" | "bitcoin";

export default function RenewForm({
  subId,
  offers,
  pending,
  paypalEnabled,
  bitcoinEnabled,
}: {
  subId: number;
  offers: RenewOffer[];
  pending: boolean;
  paypalEnabled: boolean;
  bitcoinEnabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createRenewalOrderAction, initial);
  const [offerId, setOfferId] = useState<number>(offers[0]?.id ?? 0);
  const [paymentMethod, setPaymentMethod] = useState<Method>("stripe");

  if (pending) {
    return (
      <p className="flash flash-info" style={{ margin: "14px 0 0" }}>
        Une prolongation est en cours — retrouvez-la dans « Mes commandes ».
      </p>
    );
  }
  if (offers.length === 0) return null;

  const selected = offers.find((o) => o.id === offerId) ?? offers[0];

  return (
    <div style={{ marginTop: 14 }}>
      {!open && (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setOpen(true)}
        >
          Prolonger cet abonnement
        </button>
      )}

      {open && (
        <form action={action} className="provider-panel">
          <FormErrors state={state} />
          <input type="hidden" name="sub_id" value={subId} />

          <div className="form-group">
            <label htmlFor={`renew-offer-${subId}`}>Durée de prolongation</label>
            <select
              id={`renew-offer-${subId}`}
              name="offer_id"
              className="select"
              value={selected.id}
              onChange={(e) => setOfferId(Number(e.target.value))}
            >
              {offers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                  {o.duration_label ? ` (${o.duration_label})` : ""} ·{" "}
                  {o.screens} écran{o.screens > 1 ? "s" : ""} —{" "}
                  {formatPrice(o.total_cents)}
                </option>
              ))}
            </select>
            <p className="hint">
              Mêmes identifiants : la durée s&apos;ajoute à votre échéance
              actuelle.
            </p>
          </div>

          {(paypalEnabled || bitcoinEnabled) && (
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
                {paypalEnabled && (
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
                )}
                {bitcoinEnabled && (
                  <label className="order-option">
                    <input
                      type="radio"
                      name="payment_method"
                      value="bitcoin"
                      checked={paymentMethod === "bitcoin"}
                      onChange={() => setPaymentMethod("bitcoin")}
                    />
                    <span>
                      <strong>Bitcoin</strong>
                      <small>
                        Depuis votre portefeuille BTC, prolongation après 1
                        confirmation.
                      </small>
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="order-total">
            <span>Total à régler</span>
            <strong>{formatPrice(selected.total_cents)}</strong>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <SubmitButton
              className="btn btn-primary btn-sm"
              pendingLabel={
                paymentMethod === "paypal"
                  ? "Redirection vers PayPal…"
                  : paymentMethod === "bitcoin"
                    ? "Calcul du montant en BTC…"
                    : "Redirection vers Stripe…"
              }
            >
              Payer {formatPrice(selected.total_cents)}
            </SubmitButton>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setOpen(false)}
            >
              Annuler
            </button>
          </div>
          <p
            className="hint"
            style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}
          >
            <LockIcon size={14} /> Paiement sécurisé — votre éventuel crédit de
            parrainage sera déduit de ce total.
          </p>
        </form>
      )}
    </div>
  );
}
