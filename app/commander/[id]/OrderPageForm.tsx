"use client";

import { useActionState, useMemo, useState } from "react";
import { createOrderAction } from "@/actions/order-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import { formatPrice } from "@/lib/validation";
import { offerPriceCents, type FormState } from "@/lib/types";

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
}

const WHATSAPP_NUMBER = "33651446869";
const WHATSAPP_DISPLAY = "+33 6 51 44 68 69";

export default function OrderPageForm({ offer }: { offer: OrderStepOffer }) {
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

  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Bonjour, je viens de commander l'offre « ${offer.title} » sur NexoraTV. Merci de valider ma commande.`,
  )}`;

  return (
    <form action={action} className="panel order-form">
      <h2>Votre commande</h2>
      <FormErrors state={state} />
      <input type="hidden" name="offer_id" value={offer.id} />

      <div className="order-wa-notice">
        <strong>⚠️ Étape obligatoire</strong>
        <p>
          Après avoir confirmé, vous <strong>devez</strong> nous envoyer un
          message sur WhatsApp au{" "}
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            {WHATSAPP_DISPLAY}
          </a>{" "}
          pour que votre commande soit acceptée. Sans ce message, la commande
          ne sera pas traitée.
        </p>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm order-wa-btn"
        >
          Ouvrir WhatsApp
        </a>
      </div>

      <div className="order-options">
        <label className="order-option">
          <input type="checkbox" name="want_adult" />
          <span>
            <strong>Inclure les chaînes adultes</strong>
            <small>Bouquets réservés aux adultes (18+).</small>
          </span>
        </label>
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

      <div className="order-total">
        <span>Total à régler après validation</span>
        <strong>{formatPrice(total)}</strong>
      </div>

      <SubmitButton className="btn btn-primary btn-block" pendingLabel="Envoi…">
        Confirmer la commande
      </SubmitButton>
    </form>
  );
}
