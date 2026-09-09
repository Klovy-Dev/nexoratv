"use client";

import { useActionState } from "react";
import { saveTutoSectionAction } from "@/actions/tuto-actions";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import RichTextEditor from "@/components/RichTextEditor";
import EmojiPicker from "@/components/EmojiPicker";
import type { FormState, TutoSection } from "@/lib/types";

const initial: FormState = {};

export default function TutoSectionForm({
  editing,
  nextSort,
}: {
  editing: TutoSection | null;
  nextSort: number;
}) {
  const [state, action] = useActionState(saveTutoSectionAction, initial);
  const key = editing ? `edit-${editing.id}` : "new";

  return (
    <div className="panel">
      <h2>{editing ? "Modifier la section" : "Ajouter une section"}</h2>
      <FormErrors state={state} />

      <form action={action} key={key}>
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="form-group">
          <label htmlFor="tuto-title">Titre</label>
          <input
            id="tuto-title"
            name="title"
            className="input"
            placeholder="Ex. Installer sur Android"
            defaultValue={editing?.title ?? ""}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="tuto-description">Description (sous-titre)</label>
          <input
            id="tuto-description"
            name="description"
            className="input"
            placeholder="Courte phrase affichée sous le titre (facultatif)"
            defaultValue={editing?.description ?? ""}
          />
        </div>

        <div className="form-group">
          <label>Picto</label>
          <EmojiPicker
            name="icon"
            defaultValue={editing?.icon ?? ""}
            resetKey={key}
          />
        </div>

        <div className="form-group">
          <label>Contenu</label>
          <RichTextEditor
            name="body"
            defaultValue={editing?.body ?? ""}
            resetKey={key}
          />
          <p className="hint">
            Utilisez la barre d&apos;outils pour le gras, l&apos;italique et les
            listes. Chaque retour à la ligne crée un nouveau paragraphe.
          </p>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="tuto-sort">Ordre d&apos;affichage</label>
            <input
              id="tuto-sort"
              name="sort"
              type="number"
              className="input"
              defaultValue={editing?.sort ?? nextSort}
            />
            <p className="hint">Plus le nombre est petit, plus la section remonte.</p>
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <input
            type="checkbox"
            name="published"
            defaultChecked={editing?.published ?? true}
          />
          Publiée (visible sur /tuto)
        </label>

        <SubmitButton pendingLabel="Enregistrement…">
          {editing ? "Enregistrer" : "Ajouter"}
        </SubmitButton>
      </form>
    </div>
  );
}
