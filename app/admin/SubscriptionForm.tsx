"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveSubscriptionAction } from "@/actions/admin-actions";
import { provisionSubscriptionAction } from "@/actions/goldenott-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import PasswordInput from "@/components/PasswordInput";
import { randomHandle } from "@/lib/validation";
import type { FormState, ProviderKind } from "@/lib/types";

interface Editing {
  id: number;
  label: string;
  server_url: string;
  username: string;
  expires_at: string;
  status: "active" | "suspended";
  note: string;
  screens: number | null;
}

export interface PkgOption {
  id: number;
  name: string;
  credits: number | null;
  durationLabel: string | null;
  maxConnections: number | null;
  isTrial: boolean;
}
export interface TplOption {
  id: number;
  name: string;
  scope: string;
}

export interface GoldenottFormData {
  packages: PkgOption[];
  templates: TplOption[];
  credit: number | null;
  error: string | null;
}

const initial: FormState = {};

const KIND_LABELS: Record<ProviderKind, string> = {
  line: "Ligne M3U (identifiant + mot de passe)",
  mag: "Boîtier MAG (adresse MAC)",
  code: "Code d'activation",
};

export default function SubscriptionForm({
  userId,
  editing,
  goldenott,
}: {
  userId: number;
  editing: Editing | null;
  goldenott: GoldenottFormData | null;
}) {
  const canProvision = goldenott != null && goldenott.error == null && !editing;
  const [mode, setMode] = useState<"manual" | "goldenott">(
    canProvision ? "goldenott" : "manual",
  );

  return (
    <div className="panel">
      <div className="form-mode-head">
        <h2>{editing ? "Modifier l'abonnement" : "Ajouter un abonnement"}</h2>
        {canProvision && (
          <div className="seg">
            <button
              type="button"
              className={mode === "goldenott" ? "on" : ""}
              onClick={() => setMode("goldenott")}
            >
              ⚡ Via GoldenOTT
            </button>
            <button
              type="button"
              className={mode === "manual" ? "on" : ""}
              onClick={() => setMode("manual")}
            >
              ✍️ Saisie manuelle
            </button>
          </div>
        )}
      </div>

      {goldenott?.error && !editing && (
        <p className="form-note" style={{ color: "var(--warning)" }}>
          GoldenOTT indisponible ({goldenott.error}) — seule la saisie manuelle
          est possible.
        </p>
      )}

      {mode === "goldenott" && canProvision ? (
        <GoldenottForm userId={userId} data={goldenott!} />
      ) : (
        <ManualForm userId={userId} editing={editing} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Formulaire GoldenOTT (provisioning automatique)                    */
/* ------------------------------------------------------------------ */

function GoldenottForm({
  userId,
  data,
}: {
  userId: number;
  data: GoldenottFormData;
}) {
  const [state, action] = useActionState(provisionSubscriptionAction, initial);
  const [kind, setKind] = useState<ProviderKind>("line");
  const [packageId, setPackageId] = useState<number>(data.packages[0]?.id ?? 0);
  const [username, setUsername] = useState("");

  const pkg = data.packages.find((p) => p.id === packageId) ?? null;

  return (
    <>
      <FormErrors state={state} />
      {data.credit != null && (
        <p className="form-note">
          Crédit revendeur disponible :{" "}
          <strong>{data.credit.toFixed(2)} crédits</strong>
          {pkg?.credits != null && (
            <>
              {" "}
              · ce forfait en coûte <strong>{pkg.credits}</strong>
            </>
          )}
        </p>
      )}

      <form action={action}>
        <input type="hidden" name="user_id" value={userId} />
        <input type="hidden" name="package_label" value={pkg?.name ?? ""} />

        <div className="form-group">
          <label htmlFor="go-kind">Type d&apos;abonnement</label>
          <select
            id="go-kind"
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

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="go-package">Forfait GoldenOTT</label>
            <select
              id="go-package"
              name="package_id"
              className="select"
              value={packageId}
              onChange={(e) => setPackageId(Number(e.target.value))}
            >
              {data.packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.durationLabel ? ` · ${p.durationLabel}` : ""}
                  {p.credits != null ? ` · ${p.credits} cr.` : ""}
                  {p.isTrial ? " · essai" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="go-template">Template de bouquets (optionnel)</label>
            <select
              id="go-template"
              name="template_id"
              className="select"
              defaultValue=""
            >
              <option value="">Tous les bouquets du forfait</option>
              {data.templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.scope})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="go-label">Libellé affiché au client</label>
          <input
            id="go-label"
            name="label"
            className="input"
            defaultValue="Abonnement IPTV"
            maxLength={60}
          />
        </div>

        {kind === "line" && (
          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="go-username">
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
                id="go-username"
                name="username"
                className="input"
                placeholder="vide = généré (7–12 lettres/chiffres)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
              />
              <p className="hint">7 à 12 caractères, lettres et chiffres uniquement.</p>
            </div>
            <div className="form-group">
              <label htmlFor="go-password">Mot de passe</label>
              <PasswordInput id="go-password" name="password" autoComplete="off" />
              <p className="hint">
                Vide = généré. Sinon : exactement 7 caractères, majuscules et
                chiffres.
              </p>
            </div>
          </div>
        )}

        {kind === "mag" && (
          <div className="form-group">
            <label htmlFor="go-mac">Adresse MAC du boîtier</label>
            <input
              id="go-mac"
              name="mac"
              className="input"
              placeholder="00:1A:79:XX:XX:XX"
              autoComplete="off"
            />
          </div>
        )}

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="go-screens">Connexions simultanées (optionnel)</label>
            <input
              id="go-screens"
              name="screens"
              type="number"
              className="input"
              min={1}
              max={pkg?.maxConnections ?? 5}
              placeholder={`max ${pkg?.maxConnections ?? 5}`}
            />
          </div>
          <div className="form-group" style={{ alignSelf: "center" }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" name="is_adult" />
              Inclure les bouquets adultes
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="go-note">Note interne (facultatif)</label>
          <textarea
            id="go-note"
            name="note"
            className="textarea"
            maxLength={500}
            placeholder="Visible par le client sur sa fiche."
          />
        </div>

        <SubmitButton pendingLabel="Création sur GoldenOTT…">
          Créer l&apos;abonnement
        </SubmitButton>
      </form>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Formulaire manuel (existant)                                       */
/* ------------------------------------------------------------------ */

function ManualForm({
  userId,
  editing,
}: {
  userId: number;
  editing: Editing | null;
}) {
  const [state, action] = useActionState(saveSubscriptionAction, initial);
  const key = editing ? `edit-${editing.id}` : "new";

  return (
    <>
      <FormErrors state={state} />
      <form action={action} key={key}>
        <input type="hidden" name="user_id" value={userId} />
        {editing && <input type="hidden" name="sub_id" value={editing.id} />}

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="label">Libellé</label>
            <input
              className="input"
              id="label"
              name="label"
              defaultValue={editing?.label ?? "Abonnement"}
              maxLength={60}
            />
          </div>
          <div className="form-group">
            <label htmlFor="status">Statut</label>
            <select
              className="select"
              id="status"
              name="status"
              defaultValue={editing?.status ?? "active"}
            >
              <option value="active">Actif</option>
              <option value="suspended">Suspendu</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="server_url">URL du serveur</label>
          <input
            className="input"
            id="server_url"
            name="server_url"
            placeholder="http://exemple.com:8080"
            defaultValue={editing?.server_url ?? ""}
            maxLength={255}
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="username">Nom d&apos;utilisateur</label>
            <input
              className="input"
              id="username"
              name="username"
              defaultValue={editing?.username ?? ""}
              autoComplete="off"
              maxLength={120}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">
              Mot de passe{editing ? " (laisser vide pour conserver)" : ""}
            </label>
            <PasswordInput id="password" name="password" autoComplete="off" />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="expires_at">Date d&apos;expiration</label>
            <input
              className="input"
              type="date"
              id="expires_at"
              name="expires_at"
              defaultValue={editing?.expires_at ?? ""}
            />
          </div>
          <div className="form-group">
            <label htmlFor="screens">Écrans simultanés (optionnel)</label>
            <input
              className="input"
              type="number"
              id="screens"
              name="screens"
              min={1}
              max={5}
              placeholder="Non précisé"
              defaultValue={editing?.screens ?? ""}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="note">Note (visible par le client)</label>
          <textarea
            className="textarea"
            id="note"
            name="note"
            maxLength={500}
            defaultValue={editing?.note ?? ""}
          />
        </div>

        <div className="table-actions">
          <SubmitButton>
            {editing ? "Enregistrer les modifications" : "Ajouter l'abonnement"}
          </SubmitButton>
          {editing && (
            <Link className="btn btn-ghost" href={`/admin?user=${userId}`}>
              Annuler
            </Link>
          )}
        </div>
      </form>
    </>
  );
}
