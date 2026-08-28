"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth-actions";
import type { User } from "@/lib/types";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/avis", label: "Avis" },
  { href: "/tuto", label: "Tuto" },
  { href: "/contact", label: "Contact" },
];

export default function NavBar({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="site-header">
      <div className="container nav">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="NexoraTV" className="brand-logo" width={36} height={36} />
          <span>
            Nexora<span className="brand-accent">TV</span>
          </span>
        </Link>

        <ul className={`nav-links${open ? " open" : ""}`}>
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={isActive(l.href) ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            </li>
          ))}
          {user && (
            <li>
              <Link
                href="/profil"
                className={isActive("/profil") ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                Mon profil
              </Link>
            </li>
          )}
          {user?.role === "admin" && (
            <li>
              <Link
                href="/admin"
                className={isActive("/admin") ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                Admin
              </Link>
            </li>
          )}
        </ul>

        <div className="nav-cta">
          {user ? (
            <>
              <span className="nav-user" title={user.email}>
                {user.name}
              </span>
              <form action={logoutAction} className="inline-form">
                <button type="submit" className="btn btn-ghost">
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/connexion" className="btn btn-ghost">
                Connexion
              </Link>
              <Link href="/inscription" className="btn btn-primary">
                Inscription
              </Link>
            </>
          )}
          <button
            className={`burger${open ? " open" : ""}`}
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
