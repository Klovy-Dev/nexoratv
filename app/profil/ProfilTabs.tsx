"use client";

import { useState, type ReactNode } from "react";

export interface ProfilTab {
  id: string;
  label: string;
  badge?: number;
  content: ReactNode;
}

export default function ProfilTabs({
  tabs,
  initial,
}: {
  tabs: ProfilTab[];
  initial?: string;
}) {
  const first = initial && tabs.some((t) => t.id === initial) ? initial : tabs[0]?.id;
  const [active, setActive] = useState(first);

  return (
    <div className="profil-tabs">
      <div className="profil-tabbar" role="tablist" aria-label="Sections du profil">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={active === t.id}
            className={`profil-tab${active === t.id ? " active" : ""}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
            {t.badge ? <span className="profil-tab-badge">{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          className="profil-tabpanel"
          hidden={active !== t.id}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
