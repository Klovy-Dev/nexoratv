"use client";

import { useEffect, useRef, useState } from "react";
import { EMOJI_GROUPS } from "@/lib/emoji-data";

/**
 * Sélecteur de picto (emoji) pour une section /tuto. La valeur choisie est
 * placée dans un input caché `name`. Liste inspirée de smiley.cool.
 */
export default function EmojiPicker({
  name,
  defaultValue,
  resetKey,
}: {
  name: string;
  defaultValue: string;
  resetKey: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => setValue(defaultValue), [defaultValue, resetKey]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="emoji-picker" ref={boxRef}>
      <div className="emoji-picker-bar">
        <span className="emoji-picker-preview" aria-hidden>
          {value || "—"}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setOpen((o) => !o)}
        >
          {value ? "Changer le picto" : "Choisir un picto"}
        </button>
        {value && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setValue("");
              setOpen(false);
            }}
          >
            Retirer
          </button>
        )}
      </div>

      {open && (
        <div className="emoji-panel">
          {EMOJI_GROUPS.map((group) => (
            <div key={group.label} className="emoji-group">
              <p className="emoji-group-label">{group.label}</p>
              <div className="emoji-grid">
                {group.emojis.map((e, i) => (
                  <button
                    key={`${group.label}-${i}`}
                    type="button"
                    className={`emoji-cell${e === value ? " is-active" : ""}`}
                    onClick={() => {
                      setValue(e);
                      setOpen(false);
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <input type="hidden" name={name} value={value} />
    </div>
  );
}
