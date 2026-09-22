"use client";

import { useActionState } from "react";
import { saveExpenseAction } from "@/actions/expense-actions";
import CollapsiblePanel from "@/components/CollapsiblePanel";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import type { Expense, FormState } from "@/lib/types";

const initial: FormState = {};

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpenseForm({ editing }: { editing: Expense | null }) {
  const [state, action] = useActionState(saveExpenseAction, initial);
  const key = editing ? `edit-${editing.id}` : "new";

  return (
    <CollapsiblePanel
      title={editing ? "Modifier la dépense" : "Enregistrer une dépense"}
      defaultOpen={Boolean(editing)}
    >
      <FormErrors state={state} />

      <form action={action} key={key}>
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="ex-date">Date</label>
            <input
              id="ex-date"
              name="expense_date"
              type="date"
              className="input"
              defaultValue={editing?.expense_date ?? todayInput()}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="ex-amount">Montant (€)</label>
            <input
              id="ex-amount"
              name="amount"
              className="input"
              placeholder="Ex. 25"
              defaultValue={editing ? (editing.amount_cents / 100).toFixed(2) : ""}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="ex-label">Libellé</label>
          <input
            id="ex-label"
            name="label"
            className="input"
            placeholder="Ex. Hébergement serveur"
            defaultValue={editing?.label ?? ""}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="ex-category">Catégorie (facultatif)</label>
          <input
            id="ex-category"
            name="category"
            className="input"
            list="ex-category-suggestions"
            placeholder="Hébergement, Publicité, Outils, Remboursement…"
            defaultValue={editing?.category ?? ""}
          />
          <datalist id="ex-category-suggestions">
            <option value="Hébergement" />
            <option value="Publicité" />
            <option value="Outils" />
            <option value="Remboursement" />
            <option value="Autre" />
          </datalist>
        </div>

        <div className="form-group">
          <label htmlFor="ex-note">Note (facultatif)</label>
          <input
            id="ex-note"
            name="note"
            className="input"
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
