"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveSubscriptionAction } from "@/actions/admin-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import PasswordInput from "@/components/PasswordInput";
import type { FormState } from "@/lib/types";

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

const initial: FormState = {};

export default function SubscriptionForm({
  userId,
  editing,
}: {
  userId: number;
  editing: Editing | null;
}) {
  const [state, action] = useActionState(saveSubscriptionAction, initial);
  const key = editing ? `edit-${editing.id}` : "new";

  return (
    <div className="panel">
      <h2>{editing ? "Modifier l'abonnement" : "Ajouter des identifiants"}</h2>
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
            <PasswordInput
              id="password"
              name="password"
              autoComplete="off"
            />
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
    </div>
  );
}
