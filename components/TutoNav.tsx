"use client";

import { useScrollSpy } from "@/lib/useScrollSpy";

export interface DocGroup {
  title: string;
  items: { id: string; label: string }[];
}

export function TutoSidebar({ groups }: { groups: DocGroup[] }) {
  const ids = groups.flatMap((g) => g.items.map((i) => i.id));
  const active = useScrollSpy(ids);

  return (
    <nav className="docs-sidebar">
      {groups.map((g) => (
        <div key={g.title} className="docs-nav-group">
          <h4>{g.title}</h4>
          <ul>
            {g.items.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className={active === item.id ? "active" : ""}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function TutoToc({ groups }: { groups: DocGroup[] }) {
  const items = groups.flatMap((g) => g.items);
  const ids = items.map((i) => i.id);
  const active = useScrollSpy(ids);

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
