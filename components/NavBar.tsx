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

  const close = () => setOpen(false);
  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <>
      <header className="site-header">
        <div className="container nav">
          <Link href="/" className="brand" onClick={close}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="NexoraTV" className="brand-logo" width={36} height={36} />
            <span>
              Nexora<span className="brand-accent">TV</span>
            </span>
          </Link>

          <ul className="nav-links">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={isActive(l.href) ? "active" : ""}>
                  {l.label}
                </Link>
              </li>
            ))}
            {user && (
              <li>
                <Link href="/profil" className={isActive("/profil") ? "active" : ""}>
                  Mon profil
                </Link>
              </li>
            )}
            {user?.role === "admin" && (
              <li>
                <Link href="/admin" className={isActive("/admin") ? "active" : ""}>
                  Admin
                </Link>
              </li>
            )}
          </ul>

          <div className="nav-cta">
            <div className="nav-auth">
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
            </div>
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

        <div className={`nav-drawer${open ? " open" : ""}`}>
          <nav className="nav-drawer-links">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={isActive(l.href) ? "active" : ""}
                onClick={close}
              >
                {l.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/profil"
                className={isActive("/profil") ? "active" : ""}
                onClick={close}
              >
                Mon profil
              </Link>
            )}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className={isActive("/admin") ? "active" : ""}
                onClick={close}
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="nav-drawer-account">
            {user ? (
              <>
                <div className="nav-drawer-user">
                  <span className="nav-drawer-avatar">{initial}</span>
                  <div className="nav-drawer-user-info">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                </div>
                <form action={logoutAction} className="inline-form">
                  <button type="submit" className="btn btn-danger btn-block" onClick={close}>
                    Déconnexion
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/connexion" className="btn btn-ghost btn-block" onClick={close}>
                  Connexion
                </Link>
                <Link href="/inscription" className="btn btn-primary btn-block" onClick={close}>
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {open && <div className="nav-backdrop" onClick={close} />}
    </>
  );
}
