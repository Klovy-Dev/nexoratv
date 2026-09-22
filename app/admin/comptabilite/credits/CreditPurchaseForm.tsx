"use client";

import { useActionState } from "react";
import { saveCreditPurchaseAction } from "@/actions/credit-purchase-actions";
import CollapsiblePanel from "@/components/CollapsiblePanel";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import type { CreditPurchase, FormState } from "@/lib/types";

const initial: FormState = {};

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CreditPurchaseForm({
  editing,
}: {
  editing: CreditPurchase | null;
}) {
  const [state, action] = useActionState(saveCreditPurchaseAction, initial);
  const key = editing ? `edit-${editing.id}` : "new";

  return (
    <CollapsiblePanel
      title={editing ? "Modifier l'achat de crédits" : "Enregistrer un achat de crédits"}
      defaultOpen={Boolean(editing)}
    >
      <FormErrors state={state} />

      <form action={action} key={key}>
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="cp-date">Date d&apos;achat</label>
            <input
              id="cp-date"
              name="purchased_at"
              type="date"
              className="input"
              defaultValue={editing?.purchased_at ?? todayInput()}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="cp-credits">Nombre de crédits</label>
            <input
              id="cp-credits"
              name="credits"
              className="input"
              placeholder="Ex. 50"
              defaultValue={editing?.credits ?? ""}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="cp-price">Prix payé (€)</label>
          <input
            id="cp-price"
            name="total_price"
            className="input"
            placeholder="Ex. 500"
            defaultValue={editing ? (editing.total_price_cents / 100).toFixed(2) : ""}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="cp-note">Note (facultatif)</label>
          <input
            id="cp-note"
            name="note"
            className="input"
            placeholder="Fournisseur, référence…"
            defaultValue={editing?.note ?? ""}
          />
        </div>

        <SubmitButton pendingLabel="Enregistrement…">
          {editing ? "Enregistrer" : "Ajouter"}
        </SubmitButton>
      </form>
    </CollapsiblePanel>
  );
}
