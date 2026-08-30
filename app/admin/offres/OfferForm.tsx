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
    editing?.goldenott_package_id ?? packages[0]?.id ?? 0,
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
              defaultValue={editing?.kind ?? "line"}
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
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.durationLabel ? ` · ${p.durationLabel}` : ""}
                  {p.credits != null ? ` · ${p.credits} cr.` : ""}
                </option>
              ))}
            </select>
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

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="of-price">Prix client (€)</label>
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
          </div>
          <div className="form-group">
            <label htmlFor="of-max">Connexions simultanées</label>
            <input
              id="of-max"
              name="max_connections"
              type="number"
              className="input"
              min={1}
              max={pkg?.maxConnections ?? 5}
              defaultValue={editing?.max_connections ?? ""}
              placeholder="1"
            />
          </div>
        </div>

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
