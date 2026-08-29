"use client";

import { useScrollSpy } from "@/lib/useScrollSpy";

export interface TocItem {
  id: string;
  label: string;
}

export default function TutoToc({ items }: { items: TocItem[] }) {
  const ids = items.map((i) => i.id);
  const active = useScrollSpy(ids);
  if (items.length === 0) return null;

  return (
    <nav className="docs-toc">
      <h4>Sur cette page</h4>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className={active === item.id ? "active" : ""}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
