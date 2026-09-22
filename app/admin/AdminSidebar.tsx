"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/admin", label: "Clients", icon: "👥" },
  { href: "/admin/commandes", label: "Commandes", icon: "🧾" },
  { href: "/admin/offres", label: "Offres", icon: "🏷️" },
  { href: "/admin/playlist", label: "Playlists MAC", icon: "📺" },
  { href: "/admin/tuto", label: "Page Tuto", icon: "📖" },
  { href: "/admin/journal", label: "Journal", icon: "📜" },
];

export default function AdminSidebar({ pendingOrders }: { pendingOrders: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  const current = LINKS.find((l) => isActive(l.href));
  const close = () => setOpen(false);

  // Referme le menu au changement de page (navigation via un lien du tiroir).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const renderLink = (l: (typeof LINKS)[number]) => {
    const active = isActive(l.href);
    return (
      <Link key={l.href} href={l.href} className={active ? "active" : ""} onClick={close}>
        <span aria-hidden="true">{l.icon}</span>
        {l.label}
        {l.href === "/admin/commandes" && pendingOrders > 0 && (
          <span className="admin-sidebar-badge">{pendingOrders}</span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Sidebar verticale — bureau uniquement (voir CSS, masquée <880px) */}
      <nav className="admin-sidebar">{LINKS.map(renderLink)}</nav>

      {/* Barre + bouton menu — téléphone/tablette uniquement (<880px) */}
      <div className="admin-mobile-bar">
        <button
          type="button"
          className={`burger${open ? " open" : ""}`}
          aria-label="Menu de navigation"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
          {pendingOrders > 0 && current?.href !== "/admin/commandes" && (
            <span className="admin-burger-dot" aria-hidden="true" />
          )}
        </button>
        <span className="admin-mobile-bar-label">
          {current ? (
            <>
              <span aria-hidden="true">{current.icon}</span> {current.label}
            </>
          ) : (
            "Menu"
          )}
        </span>
      </div>

      <div className={`admin-nav-drawer${open ? " open" : ""}`}>
        {LINKS.map(renderLink)}
      </div>
      {open && <div className="admin-nav-backdrop" onClick={close} />}
    </>
  );
}
