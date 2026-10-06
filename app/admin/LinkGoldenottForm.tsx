"use client";

import { useState } from "react";
import { linkGoldenottSubscriptionAction } from "@/actions/goldenott-actions";
import SubmitButton from "@/components/SubmitButton";

/** Rattache une fiche saisie à la main à l'abonnement GoldenOTT existant. */
export default function LinkGoldenottForm({
  subId,
  userId,
}: {
  subId: number;
  userId: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="provider-actions">
      <div className="table-actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setOpen((v) => !v)}
        >
          Lier à GoldenOTT
        </button>
      </div>

      {open && (
        <form action={linkGoldenottSubscriptionAction} className="provider-panel">
          <input type="hidden" name="sub_id" value={subId} />
          <input type="hidden" name="user_id" value={userId} />
          <label className="mini-label">Type</label>
          <select name="kind" className="select" defaultValue="code">
            <option value="code">Code d&apos;activation</option>
            <option value="line">Ligne M3U</option>
            <option value="mag">Boîtier MAG</option>
          </select>
          <label className="mini-label">ID de l&apos;abonnement sur le panel GoldenOTT</label>
          <input
            name="provider_ref"
            className="input"
            inputMode="numeric"
            placeholder="ex. 123456"
            required
          />
          <p className="form-note">
            Le site vérifie l&apos;abonnement auprès du panel, reprend son
            échéance, puis le client peut le prolonger lui-même depuis son
            profil.
          </p>
          <SubmitButton className="btn btn-primary btn-sm" pendingLabel="Vérification…">
            Lier
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
