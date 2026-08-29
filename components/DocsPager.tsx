"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TUTO_PAGES } from "@/lib/tuto-nav";

export default function DocsPager() {
  const pathname = usePathname();
  const idx = TUTO_PAGES.findIndex((p) => p.slug === pathname);
  if (idx === -1) return null;

  const prev = idx > 0 ? TUTO_PAGES[idx - 1] : null;
  const next = idx < TUTO_PAGES.length - 1 ? TUTO_PAGES[idx + 1] : null;
  if (!prev && !next) return null;

  return (
    <div className="docs-pager">
      {prev ? (
        <Link href={prev.slug} className="docs-pager-link prev">
          <span className="docs-pager-dir">← Précédent</span>
          <span className="docs-pager-title">{prev.label}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.slug} className="docs-pager-link next">
          <span className="docs-pager-dir">Suivant →</span>
          <span className="docs-pager-title">{next.label}</span>
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
