"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth-actions";
import { initials } from "@/lib/validation";
import type { User } from "@/lib/types";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/avis", label: "Avis" },
  { href: "/tuto", label: "Tuto" },
  { href: "/contact", label: "Contact" },
];

export default function NavBar({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [accountOpen]);

  useEffect(() => setAccountOpen(false), [pathname]);

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
          </ul>

          <div className="nav-cta">
            <div className="nav-auth">
              {user ? (
                <div className={`nav-account${accountOpen ? " open" : ""}`} ref={accountRef}>
                  <button
                    type="button"
                    className="nav-account-trigger"
                    aria-expanded={accountOpen}
                    onClick={() => setAccountOpen((v) => !v)}
                  >
                    <span className="nav-account-avatar">{initials(user.name)}</span>
                    <span>{user.name}</span>
                    <span className="nav-account-chevron" aria-hidden="true">▾</span>
                  </button>

                  <div className="nav-account-menu">
                    <div className="nav-account-menu-header">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                    <Link href="/profil" onClick={() => setAccountOpen(false)}>
                      Mon profil
                    </Link>
                    {user.role === "admin" && (
                      <Link href="/admin" onClick={() => setAccountOpen(false)}>
                        Admin
                      </Link>
                    )}
                    <form action={logoutAction} className="inline-form">
                      <button type="submit" className="danger">
                        Déconnexion
                      </button>
                    </form>
                  </div>
                </div>
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
          </nav>

          <div className="nav-drawer-account">
            {user ? (
              <>
                <div className="nav-drawer-user">
                  <span className="nav-drawer-avatar">{initials(user.name)}</span>
                  <div className="nav-drawer-user-info">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                </div>
                <Link href="/profil" className="btn btn-ghost btn-block" onClick={close}>
                  Mon profil
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="btn btn-ghost btn-block" onClick={close}>
                    Admin
                  </Link>
                )}
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
