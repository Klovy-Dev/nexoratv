"use client";

import { useActionState, useState } from "react";
import {
  extendSubscriptionAction,
  refundSubscriptionAction,
  syncSubscriptionAction,
} from "@/actions/goldenott-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import type { FormState } from "@/lib/types";
import type { PkgOption } from "./SubscriptionForm";

const initial: FormState = {};

export default function ProviderActions({
  subId,
  userId,
  packages,
}: {
  subId: number;
  userId: number;
  packages: PkgOption[];
}) {
  const [panel, setPanel] = useState<"none" | "extend" | "refund">("none");
  const [extendState, extendAction] = useActionState(
    extendSubscriptionAction,
    initial,
  );
  const [packageId, setPackageId] = useState<number>(packages[0]?.id ?? 0);
  const pkg = packages.find((p) => p.id === packageId) ?? null;

  return (
    <div className="provider-actions">
      <div className="table-actions">
        <form action={syncSubscriptionAction} className="inline-form">
          <input type="hidden" name="sub_id" value={subId} />
          <input type="hidden" name="user_id" value={userId} />
          <button className="btn btn-ghost btn-sm">↻ Sync</button>
        </form>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setPanel(panel === "extend" ? "none" : "extend")}
        >
          Prolonger
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => setPanel(panel === "refund" ? "none" : "refund")}
        >
          Rembourser
        </button>
      </div>

      {panel === "extend" && (
        <form action={extendAction} className="provider-panel">
          <FormErrors state={extendState} />
          <input type="hidden" name="sub_id" value={subId} />
          <input type="hidden" name="user_id" value={userId} />
          <input type="hidden" name="package_label" value={pkg?.name ?? ""} />
          <label className="mini-label">Forfait de prolongation</label>
          <select
            name="package_id"
            className="select"
            value={packageId}
            onChange={(e) => setPackageId(Number(e.target.value))}
          >
            {packages
              .filter((p) => !p.isTrial)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.durationLabel ? ` · ${p.durationLabel}` : ""}
                  {p.credits != null ? ` · ${p.credits} cr.` : ""}
                </option>
              ))}
          </select>
          <SubmitButton className="btn btn-primary btn-sm" pendingLabel="Prolongation…">
            Confirmer la prolongation
          </SubmitButton>
        </form>
      )}

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
