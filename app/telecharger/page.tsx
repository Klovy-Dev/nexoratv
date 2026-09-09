import Link from "next/link";
import type { Metadata } from "next";
import {
  WindowsLogo,
  AndroidLogo,
  FireTvLogo,
} from "@/components/PlatformLogos";

export const metadata: Metadata = {
  title: "Application — Bientôt disponible",
  description:
    "L'application NexoraTV est en cours de développement. Elle sera bientôt disponible pour Windows, Android et Fire TV Stick.",
};

const PLATFORMS = [
  {
    Logo: WindowsLogo,
    name: "Windows 10 / 11",
    desc: "Installeur classique, sans droits administrateur, avec mises à jour automatiques.",
  },
  {
    Logo: AndroidLogo,
    name: "Android",
    desc: "Téléphone, tablette, box et Android TV. Fichier APK à installer directement.",
  },
  {
    Logo: FireTvLogo,
    name: "Fire TV Stick",
    desc: "Installation via Downloader sur Fire TV Stick et box Android TV.",
  },
];

export default function TelechargerPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container" style={{ maxWidth: 680, textAlign: "center" }}>
          <span className="soon-badge">🚧 En cours de développement</span>
          <h1>
            L&apos;application <span className="gradient-text">arrive bientôt</span>
          </h1>
          <p className="lead" style={{ marginInline: "auto" }}>
            Notre lecteur maison pour regarder vos chaînes, films et séries&nbsp;:
            interface rapide, lecteur intégré, reprise de lecture et mises à jour
            automatiques.
          </p>
        </div>
      </section>

      <section style={{ paddingTop: 24 }}>
        <div className="container" style={{ maxWidth: 960 }}>
          <div className="grid">
            {PLATFORMS.map((p) => (
              <div key={p.name} className="card reveal soon-card">
                <div className="card-icon is-logo">
                  <p.Logo size={30} />
                </div>
                <h3>{p.name}</h3>
                <p>{p.desc}</p>
                <span className="soon-tag">Bientôt</span>
              </div>
            ))}
          </div>

          <div className="panel reveal" style={{ marginTop: 28 }}>
            <h2>En attendant</h2>
            <p style={{ color: "var(--text-muted)" }}>
              Votre abonnement fonctionne dès maintenant avec n&apos;importe
              quelle application compatible <strong>Xtream Codes</strong>{" "}
              (IPTV&nbsp;Smarters, TiviMate, iMPlayer…). Vos identifiants de
              connexion sont disponibles dans votre profil.
            </p>
            <div
              className="hero-actions"
              style={{ justifyContent: "flex-start", marginTop: 18 }}
            >
              <Link href="/profil" className="btn btn-ghost">
                Voir mes identifiants
              </Link>
              <Link href="/tuto" className="btn btn-ghost">
                Consulter les tutos
              </Link>
            </div>
          </div>

          <div className="cta-band reveal" style={{ marginTop: 40 }}>
            <h2>Pas encore abonné&nbsp;?</h2>
            <p className="lead">
              Créez votre compte et choisissez votre formule en quelques minutes.
            </p>
            <div className="hero-actions">
              <Link href="/commander" className="btn btn-primary">
                Voir les offres
              </Link>
              <Link href="/contact" className="btn btn-ghost">
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
