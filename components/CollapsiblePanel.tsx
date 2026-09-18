"use client";

import { useState, type ReactNode } from "react";

export default function CollapsiblePanel({
  title,
  defaultOpen,
  children,
}: {
  title: ReactNode;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="panel">
      <button
        type="button"
        className="collapsible-head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <h2>{title}</h2>
        <span className="collapsible-chevron" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  );
}
