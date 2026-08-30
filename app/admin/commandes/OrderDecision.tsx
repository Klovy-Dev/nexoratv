"use client";

import { useActionState, useState } from "react";
import { approveOrderAction, rejectOrderAction } from "@/actions/order-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import { randomHandle } from "@/lib/validation";
import type { FormState } from "@/lib/types";

const initial: FormState = {};

export default function OrderDecision({
  orderId,
  kind,
  isRenewal,
  defaultLabel,
}: {
  orderId: number;
  kind: "line" | "mag" | "code";
  isRenewal: boolean;
  defaultLabel: string;
}) {
  const [mode, setMode] = useState<"none" | "approve" | "reject">("none");
  const [approveState, approveAction] = useActionState(
    approveOrderAction,
    initial,
  );
  const [username, setUsername] = useState("");

  return (
    <div className="order-decision">
      <div className="table-actions">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setMode(mode === "approve" ? "none" : "approve")}
        >
          Valider &amp; provisionner
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => setMode(mode === "reject" ? "none" : "reject")}
        >
          Refuser
        </button>
      </div>

      {mode === "approve" && (
        <form action={approveAction} className="provider-panel">
          <FormErrors state={approveState} />
          <input type="hidden" name="order_id" value={orderId} />

          {!isRenewal && (
            <>
              <label className="mini-label">Libellé affiché au client</label>
              <input
                name="label"
                className="input"
                defaultValue={defaultLabel}
                maxLength={60}
              />

              {kind === "line" && (
                <div className="grid-2" style={{ marginTop: 10 }}>
                  <div>
                    <label className="mini-label">
                      Identifiant{" "}
                      <button
                        type="button"
                        className="mini-link"
                        onClick={() => setUsername(randomHandle())}
                      >
                        générer
                      </button>
                    </label>
                    <input
                      name="username"
                      className="input"
                      placeholder="vide = auto"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="mini-label">Mot de passe</label>
                    <input
                      name="password"
                      className="input"
                      placeholder="vide = auto"
                      autoComplete="off"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <label className="mini-label" style={{ marginTop: 10 }}>
            Note interne (optionnel)
          </label>
          <input name="admin_note" className="input" maxLength={200} />

          <SubmitButton
            className="btn btn-primary btn-sm"
            pendingLabel="Provisioning GoldenOTT…"
          >
            {isRenewal ? "Prolonger sur GoldenOTT" : "Créer l'abonnement"}
          </SubmitButton>
        </form>
      )}

      {mode === "reject" && (
        <form action={rejectOrderAction} className="provider-panel">
          <input type="hidden" name="order_id" value={orderId} />
          <label className="mini-label">Motif du refus (visible par le client)</label>
          <input name="admin_note" className="input" maxLength={200} />
          <SubmitButton className="btn btn-danger btn-sm">
            Confirmer le refus
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
