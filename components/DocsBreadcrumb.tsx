"use client";

import { usePathname } from "next/navigation";
import { TUTO_NAV } from "@/lib/tuto-nav";

export default function DocsBreadcrumb() {
  const pathname = usePathname();
  let group = "";
  let page = "";

  for (const g of TUTO_NAV) {
    const found = g.pages.find((p) => p.slug === pathname);
    if (found) {
      group = g.title;
      page = found.label;
      break;
    }
  }

  return (
    <div className="docs-breadcrumb">
      <span>Documentation</span>
      {group && (
        <>
          <span className="sep">/</span>
          <span>{group}</span>
        </>
      )}
      {page && (
        <>
          <span className="sep">/</span>
          <span className="current">{page}</span>
        </>
      )}
    </div>
  );
}
