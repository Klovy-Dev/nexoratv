"use client";

import { useActionState, useState } from "react";
import { createRenewalOrderAction } from "@/actions/order-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import { formatPrice } from "@/lib/validation";
import type { FormState } from "@/lib/types";

const initial: FormState = {};

export interface RenewOffer {
  id: number;
  title: string;
  price_cents: number;
  duration_label: string;
}

export default function RenewButton({
  subId,
  offers,
  pending,
}: {
  subId: number;
  offers: RenewOffer[];
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createRenewalOrderAction, initial);

  if (pending) {
    return (
      <p className="flash flash-info" style={{ margin: "14px 0 0" }}>
        Demande de renouvellement en cours de traitement.
      </p>
    );
  }
  if (offers.length === 0) return null;

  return (
    <div style={{ marginTop: 14 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen((v) => !v)}>
        Renouveler
      </button>

      {open && (
        <form action={action} className="provider-panel">
          <FormErrors state={state} />
          <input type="hidden" name="sub_id" value={subId} />
          <label className="mini-label">Durée de renouvellement</label>
          <select name="offer_id" className="select" defaultValue={offers[0].id}>
            {offers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title} — {formatPrice(o.price_cents)}
                {o.duration_label ? ` / ${o.duration_label}` : ""}
              </option>
            ))}
          </select>
          <SubmitButton className="btn btn-primary btn-sm" pendingLabel="Envoi…">
            Demander le renouvellement
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
