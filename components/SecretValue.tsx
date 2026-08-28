"use client";

import { useState } from "react";
import CopyButton from "@/components/CopyButton";

const MASK = "••••••••••";

export default function SecretValue({ value }: { value: string }) {
  const [shown, setShown] = useState(false);

  if (!value) {
    return <span className="v secret">—</span>;
  }

  return (
    <>
      <span className="v secret">{shown ? value : MASK}</span>
      <span style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          className="copy-btn"
          onClick={() => setShown((v) => !v)}
        >
          {shown ? "Masquer" : "Afficher"}
        </button>
        <CopyButton value={value} />
      </span>
    </>
  );
}
