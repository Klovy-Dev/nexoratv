"use client";

import { useState } from "react";
import {
  refundSubscriptionAction,
  syncSubscriptionAction,
} from "@/actions/goldenott-actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";

export default function ProviderActions({
  subId,
  userId,
}: {
  subId: number;
  userId: number;
}) {
  const [panel, setPanel] = useState<"none" | "refund">("none");

  return (
    <div className="provider-actions">
      <div className="table-actions">
        <form action={syncSubscriptionAction} className="inline-form">
          <input type="hidden" name="sub_id" value={subId} />
          <input type="hidden" name="user_id" value={userId} />
          <button className="btn btn-ghost btn-sm">↻ Sync</button>
        </form>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => setPanel(panel === "refund" ? "none" : "refund")}
        >
          Rembourser
        </button>
      </div>

      {panel === "refund" && (
        <form action={refundSubscriptionAction} className="provider-panel">
          <input type="hidden" name="sub_id" value={subId} />
          <input type="hidden" name="user_id" value={userId} />
          <label className="mini-label" style={{ display: "flex", gap: 8 }}>
            <input type="checkbox" name="mass_refund" />
            Rembourser tout l&apos;historique (mass refund)
          </label>
          <p className="form-note">
            Le remboursement crédite ton compte revendeur et suspend
            l&apos;abonnement côté client.
          </p>
          <ConfirmSubmit
            className="btn btn-danger btn-sm"
            confirm="Confirmer le remboursement de cet abonnement ?"
          >
            Confirmer le remboursement
          </ConfirmSubmit>
        </form>
      )}
    </div>
  );
}
