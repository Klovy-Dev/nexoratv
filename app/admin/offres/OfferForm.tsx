"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveOfferAction } from "@/actions/offer-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import type { FormState, Offer, ProviderKind } from "@/lib/types";
import type { PkgOption, TplOption } from "../SubscriptionForm";

const initial: FormState = {};

const KIND_LABELS: Record<ProviderKind, string> = {
  line: "Ligne M3U",
  mag: "Boîtier MAG",
  code: "Code d'activation",
};

export default function OfferForm({
  editing,
  packages,
  templates,
}: {
  editing: Offer | null;
  packages: PkgOption[];
  templates: TplOption[];
}) {
  const [state, action] = useActionState(saveOfferAction, initial);
  const [packageId, setPackageId] = useState<number>(
    editing?.goldenott_package_id ??
      packages.find((p) => !p.isTrial)?.id ??
      packages[0]?.id ??
      0,
  );
  const [kind, setKind] = useState<ProviderKind>(editing?.kind ?? "line");
  const [allowScreens, setAllowScreens] = useState<boolean>(
    editing?.allow_screens ?? false,
  );
  const pkg = packages.find((p) => p.id === packageId) ?? null;
  const key = editing ? `edit-${editing.id}` : "new";

  return (
    <div className="panel">
      <h2>{editing ? "Modifier l'offre" : "Nouvelle offre"}</h2>
      <FormErrors state={state} />

      <form action={action} key={key}>
        {editing && <input type="hidden" name="offer_id" value={editing.id} />}

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="of-kind">Type</label>
            <select
              id="of-kind"
              name="kind"
              className="select"
              value={kind}
              onChange={(e) => setKind(e.target.value as ProviderKind)}
            >
              {(Object.keys(KIND_LABELS) as ProviderKind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="of-package">Forfait GoldenOTT</label>
            <select
              id="of-package"
              name="goldenott_package_id"
              className="select"
              value={packageId}
              onChange={(e) => setPackageId(Number(e.target.value))}
            >
              <optgroup label="Forfaits payants">
                {packages
                  .filter((p) => !p.isTrial)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.durationLabel ? ` · ${p.durationLabel}` : ""}
                      {p.credits != null ? ` · ${p.credits} cr.` : ""}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Essais (0 crédit, courte durée)">
                {packages
                  .filter((p) => p.isTrial)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      ESSAI — {p.name}
                      {p.durationLabel ? ` · ${p.durationLabel}` : ""}
                    </option>
                  ))}
              </optgroup>
            </select>
            {pkg?.isTrial ? (
              <p className="hint" style={{ color: "var(--warning)" }}>
                ⚠️ Forfait d&apos;essai : ne consomme aucun crédit et n&apos;est
                valable que {pkg.durationLabel ?? "quelques heures"}. À
                réserver aux offres découverte.
              </p>
            ) : (
              <p className="hint">
                Coûte {pkg?.credits ?? "?"} crédit
                {(pkg?.credits ?? 0) > 1 ? "s" : ""} par souscription.
              </p>
            )}
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="of-title">Titre commercial</label>
            <input
              id="of-title"
              name="title"
              className="input"
              defaultValue={editing?.title ?? ""}
              placeholder="Abonnement 12 mois"
              maxLength={80}
            />
          </div>
          <div className="form-group">
            <label htmlFor="of-duration">Durée affichée</label>
            <input
              id="of-duration"
              name="duration_label"
              className="input"
              defaultValue={editing?.duration_label ?? pkg?.durationLabel ?? ""}
              placeholder="12 mois"
              maxLength={40}
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="of-tagline">Accroche (optionnel)</label>
            <input
              id="of-tagline"
              name="tagline"
              className="input"
              defaultValue={editing?.tagline ?? ""}
              placeholder="Le meilleur rapport qualité/prix"
              maxLength={120}
            />
          </div>
          <div className="form-group">
            <label htmlFor="of-badge">Bandeau « mis en avant » (optionnel)</label>
            <input
              id="of-badge"
              name="badge"
              className="input"
              defaultValue={editing?.badge ?? ""}
              placeholder="Best Seller"
              maxLength={24}
            />
            <p className="hint">
              Si rempli, un encadré coloré entoure l&apos;offre sur la page
              Commander.
            </p>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="of-price">Prix client de base (€)</label>
            <input
              id="of-price"
              name="price"
              className="input"
              inputMode="decimal"
              defaultValue={
                editing ? (editing.price_cents / 100).toFixed(2) : ""
              }
              placeholder="59,90"
            />
            <p className="hint">Tarif pour le nombre d&apos;écrans inclus.</p>
          </div>
          <div className="form-group">
            <label htmlFor="of-included">Écrans inclus</label>
            <input
              id="of-included"
              name="included_screens"
              type="number"
              className="input"
              min={1}
              max={5}
              defaultValue={editing?.included_screens ?? 1}
            />
          </div>
        </div>

        {kind === "line" && (
          <div
            className="stack"
            style={{
              background: "var(--bg-soft)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: 16,
              marginBottom: 18,
            }}
          >
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                name="allow_screens"
                checked={allowScreens}
                onChange={(e) => setAllowScreens(e.target.checked)}
              />
              Le client choisit son nombre d&apos;écrans sur la page Commander
            </label>
            {allowScreens && (
              <div className="grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="of-extra">Supplément par écran en plus (€)</label>
                  <input
                    id="of-extra"
                    name="extra_screen_price"
                    className="input"
                    inputMode="decimal"
                    defaultValue={
                      editing ? (editing.extra_screen_cents / 100).toFixed(2) : "3"
                    }
                    placeholder="3"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="of-maxscreens">Écrans maximum</label>
                  <input
                    id="of-maxscreens"
                    name="max_screens"
                    type="number"
                    className="input"
                    min={1}
                    max={5}
                    defaultValue={editing?.max_screens ?? 5}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="of-template">Template de bouquets (optionnel)</label>
            <select
              id="of-template"
              name="goldenott_template_id"
              className="select"
              defaultValue={editing?.goldenott_template_id ?? ""}
            >
              <option value="">Tous les bouquets du forfait</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.scope})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="of-sort">Ordre d&apos;affichage</label>
            <input
              id="of-sort"
              name="sort"
              type="number"
              className="input"
              defaultValue={editing?.sort ?? 0}
            />
          </div>
        </div>

        <div className="stack" style={{ margin: "6px 0 18px" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              name="is_adult"
              defaultChecked={editing?.is_adult ?? false}
            />
            Inclure les bouquets adultes
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              name="active"
              defaultChecked={editing?.active ?? true}
            />
            Offre visible sur la page « Commander »
          </label>
        </div>

        <div className="table-actions">
          <SubmitButton>{editing ? "Enregistrer" : "Créer l'offre"}</SubmitButton>
          {editing && (
            <Link className="btn btn-ghost" href="/admin/offres">
              Annuler
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
