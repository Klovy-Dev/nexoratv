import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Application — Bientôt disponible",
  description:
    "L'application NexoraTV est en cours de développement. Elle sera bientôt disponible pour Windows, Android et Fire TV Stick.",
};

export default function TelechargerPage() {
  return (
    <section className="page-hero">
      <div className="container" style={{ maxWidth: 640, textAlign: "center" }}>
        <span className="eyebrow">Application NexoraTV</span>
        <h1>
          <span className="gradient-text">Bientôt disponible</span>
        </h1>
        <p className="lead" style={{ marginInline: "auto" }}>
          Notre application maison (TV, films et séries, lecteur intégré, reprise
          de lecture) est actuellement <strong>en cours de développement</strong>.
          Elle arrivera prochainement pour Windows, Android et Fire&nbsp;TV
          Stick.
        </p>
        <p className="lead" style={{ marginInline: "auto" }}>
          En attendant, votre abonnement fonctionne avec n&apos;importe quelle
          application compatible <strong>Xtream Codes</strong>.
        </p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link href="/commander" className="btn btn-primary">
            Voir les offres
          </Link>
          <Link href="/contact" className="btn btn-ghost">
            Nous contacter
          </Link>
        </div>
      </div>
    </section>
  );
}
