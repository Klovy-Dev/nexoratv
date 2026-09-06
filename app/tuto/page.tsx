import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tuto — Bientôt disponible" };

export default function TutoPage() {
  return (
    <section className="page-hero">
      <div className="container" style={{ maxWidth: 640, textAlign: "center" }}>
        <span className="eyebrow">Tuto</span>
        <h1>
          <span className="gradient-text">Bientôt disponible</span>
        </h1>
        <p className="lead" style={{ marginInline: "auto" }}>
          Le guide d&apos;installation arrive prochainement. En attendant,
          l&apos;équipe reste joignable pour vous accompagner.
        </p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link href="/telecharger" className="btn btn-primary">
            Installer l&apos;application
          </Link>
          <Link href="/contact" className="btn btn-ghost">
            Nous contacter
          </Link>
        </div>
      </div>
    </section>
  );
}
