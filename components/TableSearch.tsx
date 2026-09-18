"use client";

import { useState } from "react";

/**
 * Filtre en direct des lignes d'un tableau/d'une liste sans aller-retour
 * serveur : chaque ligne porte un attribut `data-search="texte en minuscule"`
 * dans le conteneur `containerId`, et cette barre bascule leur affichage.
 */
export default function TableSearch({
  placeholder,
  containerId,
  rowSelector,
}: {
  placeholder: string;
  containerId: string;
  rowSelector: string;
}) {
  const [value, setValue] = useState("");

  function apply(next: string) {
    setValue(next);
    const container = document.getElementById(containerId);
    if (!container) return;
    const needle = next.trim().toLowerCase();
    container.querySelectorAll<HTMLElement>(rowSelector).forEach((el) => {
      const hay = el.dataset.search ?? "";
      el.style.display = !needle || hay.includes(needle) ? "" : "none";
    });
  }

  return (
    <input
      type="search"
      className="input"
      placeholder={placeholder}
      value={value}
      onChange={(e) => apply(e.target.value)}
      style={{ marginBottom: 16, maxWidth: 340 }}
    />
  );
}
