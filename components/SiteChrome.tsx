"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import PartnerBanner from "@/components/PartnerBanner";

/**
 * Choisit la mise en page selon la route :
 *  - pages « auth » (connexion, inscription, reset) → plein écran, centré,
 *    sans header ni footer, avec un panneau latéral de marque ;
 *  - toutes les autres pages → header + contenu + footer.
 */
const BARE_PREFIXES = [
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
];

export default function SiteChrome({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const bare = BARE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  // L'espace admin a sa propre coquille (header + sidebar, voir
  // app/admin/layout.tsx) — pas de header/footer/bannière publics ici.
  if (isAdmin) {
    return <>{children}</>;
  }

  if (bare) {
    return (
      <>
        <PartnerBanner />
        <main className="auth-shell">
          <aside className="auth-aside">
            <Link href="/" className="auth-aside-brand">
              Nexora<span>TV</span>
            </Link>
            <div className="auth-aside-body">
              <h2>Le streaming nouvelle génération.</h2>
              <ul>
                <li>Des milliers de chaînes, films et séries en direct</li>
                <li>Vos identifiants d&apos;abonnement réunis au même endroit</li>
                <li>Compatible avec tous vos écrans, sans coupure</li>
              </ul>
            </div>
            <p className="auth-aside-foot">
              © {new Date().getFullYear()} NexoraTV
            </p>
          </aside>
          <div className="auth-panel">{children}</div>
        </main>
      </>
    );
  }

  return (
    <>
      <PartnerBanner />
      {header}
      <main>{children}</main>
      {footer}
    </>
  );
}
