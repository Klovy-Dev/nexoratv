"use client";

import { useActionState } from "react";
import { saveDevicePlaylistAction } from "@/actions/device-playlist-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import type { DevicePlaylist, FormState } from "@/lib/types";

const initial: FormState = {};

export default function DevicePlaylistForm({
  editing,
}: {
  editing: DevicePlaylist | null;
}) {
  const [state, action] = useActionState(saveDevicePlaylistAction, initial);
  const key = editing ? `edit-${editing.id}` : "new";

  return (
    <div className="panel">
      <h2>{editing ? "Modifier la playlist" : "Assigner une playlist à un MAC"}</h2>
      <FormErrors state={state} />

      <form action={action} key={key}>
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="dp-mac">Adresse MAC</label>
            <input
              id="dp-mac"
              name="mac"
              className="input"
              placeholder="00:1A:79:AB:CD:EF"
              defaultValue={editing?.mac ?? ""}
              required
            />
            <p className="hint">
              Celle affichée dans l&apos;app (Sources → Activer par adresse MAC).
            </p>
          </div>
          <div className="form-group">
            <label htmlFor="dp-name">Nom (affiché dans l&apos;app)</label>
            <input
              id="dp-name"
              name="name"
              className="input"
              placeholder="Ex. Client Dupont"
              defaultValue={editing?.name ?? ""}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="dp-m3u">URL de la playlist M3U</label>
          <input
            id="dp-m3u"
            name="m3u_url"
            className="input"
            placeholder="http://exemple.com/get.php?username=...&password=..."
            defaultValue={editing?.m3u_url ?? ""}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="dp-epg">URL EPG XMLTV (facultatif)</label>
          <input
            id="dp-epg"
            name="epg_url"
            className="input"
            defaultValue={editing?.epg_url ?? ""}
          />
        </div>

        <div className="form-group">
          <label htmlFor="dp-note">Note interne (facultatif)</label>
          <input
            id="dp-note"
            name="note"
            className="input"
            defaultValue={editing?.note ?? ""}
          />
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <input
            type="checkbox"
            name="active"
            defaultChecked={editing?.active ?? true}
          />
          Active (le MAC peut charger la playlist)
        </label>

        <SubmitButton pendingLabel="Enregistrement…">
          {editing ? "Enregistrer" : "Ajouter"}
        </SubmitButton>
      </form>
    </div>
  );
}
