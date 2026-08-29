"use client";

import { useState } from "react";
import PasswordStrength from "@/components/PasswordStrength";

interface Props {
  id: string;
  name: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
  placeholder?: string;
  autoFocus?: boolean;
  /** Affiche la jauge de robustesse sous le champ. */
  showStrength?: boolean;
}

export default function PasswordInput({
  id,
  name,
  required,
  autoComplete = "current-password",
  minLength,
  placeholder,
  autoFocus,
  showStrength,
}: Props) {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [value, setValue] = useState("");

  const checkCaps = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCaps(e.getModifierState?.("CapsLock") ?? false);
  };

  return (
    <>
      <div className="pw-wrap">
        <input
          className="input"
          type={show ? "text" : "password"}
          id={id}
          name={name}
          required={required}
          autoComplete={autoComplete}
          minLength={minLength}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={showStrength ? (e) => setValue(e.target.value) : undefined}
          onKeyUp={checkCaps}
          onKeyDown={checkCaps}
          onBlur={() => setCaps(false)}
        />
        <button
          type="button"
          className="pw-toggle"
          onClick={() => setShow((v) => !v)}
          aria-pressed={show}
        >
          {show ? "Masquer" : "Afficher"}
        </button>
      </div>
      {caps && (
        <p className="pw-caps" role="status">
          Verrouillage des majuscules activé
        </p>
      )}
      {showStrength && <PasswordStrength value={value} />}
    </>
  );
}
