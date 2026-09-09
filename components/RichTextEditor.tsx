"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { htmlToMarkdown, markdownToHtml } from "@/lib/tuto-format";

/**
 * Éditeur de texte enrichi (contentEditable) pour le corps des sections
 * /tuto. Enregistre la valeur en Markdown léger dans un input caché `name`,
 * afin de rester compatible avec l'affichage public existant.
 */
export default function RichTextEditor({
  name,
  defaultValue,
  resetKey,
}: {
  name: string;
  defaultValue: string;
  /** change de valeur quand on passe en édition d'une autre section */
  resetKey: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [md, setMd] = useState(defaultValue);

  const sync = useCallback(() => {
    if (ref.current) setMd(htmlToMarkdown(ref.current));
  }, []);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = markdownToHtml(defaultValue) || "<p><br></p>";
    }
    setMd(defaultValue);
  }, [defaultValue, resetKey]);

  const cmd = (command: string, value?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, value);
    sync();
  };

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <button type="button" onClick={() => cmd("bold")} title="Gras">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => cmd("italic")} title="Italique">
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => cmd("insertUnorderedList")}
          title="Liste à puces"
        >
          • Liste
        </button>
        <button
          type="button"
          onClick={() => cmd("insertOrderedList")}
          title="Liste numérotée"
        >
          1. Étapes
        </button>
        <button
          type="button"
          onClick={() => cmd("removeFormat")}
          title="Effacer la mise en forme"
        >
          ✕ Format
        </button>
      </div>

      <div
        ref={ref}
        className="rte-area"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Contenu de la section"
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          sync();
        }}
      />

      <input type="hidden" name={name} value={md} />
    </div>
  );
}
