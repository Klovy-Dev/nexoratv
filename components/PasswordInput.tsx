"use client";

import { useState } from "react";

interface Props {
  id: string;
  name: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
  placeholder?: string;
}

export default function PasswordInput({
  id,
  name,
  required,
  autoComplete = "current-password",
  minLength,
  placeholder,
}: Props) {
  const [show, setShow] = useState(false);

  return (
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
      />
      <button
        type="button"
        className="pw-toggle"
        onClick={() => setShow((v) => !v)}
      >
        {show ? "Masquer" : "Afficher"}
      </button>
    </div>
  );
}
