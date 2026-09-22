import Link from "next/link";
import {
  TvIcon,
  BoltIcon,
  MonitorIcon,
  FilmIcon,
  LockIcon,
  ChatIcon,
} from "@/components/icons";
import { listReviews, reviewStats } from "@/lib/data";
import { formatDate, initials } from "@/lib/validation";

const FEATURES = [
  [TvIcon, "Catalogue immense", "Chaînes internationales, sport, cinéma, jeunesse et documentaires réunis dans une seule application."],
  [BoltIcon, "Zapping instantané", "Serveurs optimisés et anti-freeze pour un démarrage des flux en moins d'une seconde."],
  [MonitorIcon, "Multi-appareils", "Smart TV, Android, iOS, Fire Stick, box et ordinateur : votre compte vous suit partout."],
  [FilmIcon, "VOD & replay", "Des milliers de films et séries à la demande, mis à jour chaque semaine."],
  [LockIcon, "Connexion stable", "Infrastructure redondée avec compatibilité VPN pour une lecture fiable en toutes circonstances."],
  [ChatIcon, "Support réactif", "Une équipe joignable 7j/7 par messagerie pour vous accompagner à chaque étape."],
] as const;

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [reviews, stats] = await Promise.all([listReviews(), reviewStats()]);
  const highlighted = [...reviews]
    .sort((a, b) => b.rating - a.rating || +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 3);
  const rounded = Math.round(stats.average);

  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="eyebrow">Streaming nouvelle génération</span>
          <h1>
            Tout votre divertissement,{" "}
            <span className="gradient-text">en un seul endroit</span>
          </h1>
          <p className="lead">
            NexoraTV réunit des milliers de chaînes en direct, films et séries à
            la demande dans une interface claire, rapide et disponible sur tous
            vos écrans.
          </p>
          <div className="hero-actions">
            <Link href="/inscription" className="btn btn-primary">
              Créer mon compte
            </Link>
            <Link href="/telecharger" className="btn btn-ghost">
              Installer l&apos;app
            </Link>
          </div>
          <div className="hero-stats">
            <div><strong>+20 000</strong><span>chaînes en direct</span></div>
            <div><strong>100 000+</strong><span>films &amp; séries</span></div>
            <div><strong>HD</strong><span>jusqu&apos;à Full HD</span></div>
            <div><strong>24/7</strong><span>support client</span></div>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Pourquoi NexoraTV</span>
            <h2>Pensé pour une expérience sans friction</h2>
            <p className="lead">
              Une plateforme épurée qui met vos contenus en avant, pas les menus.
            </p>
          </div>
          <div className="grid">
            {FEATURES.map(([Icon, title, text]) => (
              <div className="card reveal" key={title}>
                <div className="card-icon">
                  <Icon />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {highlighted.length > 0 && (
        <section style={{ background: "var(--bg-soft)" }}>
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">Ils utilisent NexoraTV</span>
              <h2>La confiance de notre communauté</h2>
              <p className="stars" style={{ fontSize: "1.3rem", margin: "6px 0" }}>
                {"★".repeat(rounded)}
                {"☆".repeat(5 - rounded)}
              </p>
              <p className="lead">
                {stats.average.toFixed(1).replace(".", ",")} / 5 sur {stats.count} avis
              </p>
            </div>
            <div className="reviews-grid">
              {highlighted.map((r) => (
                <article className="review reveal" key={r.id}>
                  <div className="review-head">
                    <div className="avatar">{initials(r.name)}</div>
                    <div>
                      <div className="who">{r.name}</div>
                      <div className="when">{formatDate(r.created_at)}</div>
                    </div>
                  </div>
                  <div className="stars">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </div>
                  <p>{r.body}</p>
                </article>
              ))}
            </div>
            <div className="center mt-40 reveal">
              <Link href="/avis" className="btn btn-ghost">
                Voir tous les avis →
              </Link>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="container">
          <div className="cta-band reveal">
            <span className="eyebrow">Prêt à commencer ?</span>
            <h2>Lancez-vous avec NexoraTV</h2>
            <p className="lead">
              Rejoignez des milliers d&apos;utilisateurs et retrouvez tous vos
              identifiants d&apos;abonnement au même endroit.
            </p>
            <div className="hero-actions">
              <Link href="/inscription" className="btn btn-primary">
                Créer mon compte
              </Link>
              <Link href="/avis" className="btn btn-ghost">
                Lire les avis
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
