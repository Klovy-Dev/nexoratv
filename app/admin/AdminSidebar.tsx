"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Clients", icon: "👥" },
  { href: "/admin/commandes", label: "Commandes", icon: "🧾" },
  { href: "/admin/offres", label: "Offres", icon: "🏷️" },
  { href: "/admin/playlist", label: "Playlists MAC", icon: "📺" },
  { href: "/admin/tuto", label: "Page Tuto", icon: "📖" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="admin-sidebar">
      {LINKS.map((l) => {
        const active =
          l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={active ? "active" : ""}>
            <span aria-hidden="true">{l.icon}</span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
