"use client";

import { useState } from "react";

export interface FaqEntry {
  q: string;
  a: string;
}

export default function Faq({ items }: { items: FaqEntry[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="faq">
      {items.map((item, i) => (
        <div key={i} className={`faq-item${open === i ? " open" : ""}`}>
          <button
            className="faq-q"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            {item.q}
          </button>
          <div
            className="faq-a"
            style={{ maxHeight: open === i ? "600px" : 0 }}
          >
            <p>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
