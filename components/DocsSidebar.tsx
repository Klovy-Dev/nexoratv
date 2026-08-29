"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TUTO_NAV } from "@/lib/tuto-nav";

export default function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="docs-sidebar">
      {TUTO_NAV.map((g) => (
        <div key={g.title} className="docs-nav-group">
          <h4>{g.title}</h4>
          <ul>
            {g.pages.map((p) => (
              <li key={p.slug}>
                <Link href={p.slug} className={pathname === p.slug ? "active" : ""}>
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
