import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Avis clients" };

const REVIEWS: [string, string, string, number, string][] = [
  ["JL", "Julien L.", "Il y a 3 jours", 5, "Installation faite en 4 minutes sur ma Smart TV grâce au tuto. Aucune coupure depuis deux mois, même sur les gros matchs. Je recommande."],
  ["SM", "Sofia M.", "Il y a 1 semaine", 5, "Le catalogue VOD est énorme et mis à jour très régulièrement. L'interface est claire, on trouve tout de suite ce qu'on cherche."],
  ["KD", "Karim D.", "Il y a 2 semaines", 4, "Très bon service dans l'ensemble. Une petite latence au démarrage de certaines chaînes étrangères, mais le support m'a aidé à changer de serveur rapidement."],
  ["EP", "Élodie P.", "Il y a 3 semaines", 5, "Ce que j'apprécie le plus : ça marche sur le téléphone, la tablette et la TV avec le même compte. Qualité 4K impeccable sur les documentaires."],
  ["TN", "Thomas N.", "Il y a 1 mois", 5, "Support client vraiment réactif, réponse en moins de 10 minutes un dimanche soir. Ça change de mes expériences précédentes."],
  ["AB", "Amina B.", "Il y a 1 mois", 4, "Rapport qualité-prix excellent. J'aurais aimé quelques chaînes régionales supplémentaires, mais l'essentiel y est largement."],
  ["RC", "Raphaël C.", "Il y a 2 mois", 5, "Je suis passé de trois abonnements séparés à un seul avec NexoraTV. Simple, stable, et le zapping est instantané."],
  ["LG", "Laura G.", "Il y a 2 mois", 5, "Débutante en streaming, j'avais peur de la config. Le guide pas à pas est parfait, tout est expliqué clairement."],
  ["MF", "Marc F.", "Il y a 3 mois", 5, "Utilisé sur Fire Stick et box Android, zéro problème. La lecture reprend là où je m'étais arrêté sur mes séries."],
];

const BARS: [string, number][] = [
  ["5 ★", 78],
  ["4 ★", 15],
  ["3 ★", 4],
  ["2 ★", 2],
  ["1 ★", 1],
];

export default function AvisPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Ils utilisent NexoraTV</span>
          <h1>
            Les avis de <span className="gradient-text">notre communauté</span>
          </h1>
          <p className="lead" style={{ marginInline: "auto" }}>
            Retours d&apos;expérience partagés par des utilisateurs abonnés. Note
            moyenne calculée sur l&apos;ensemble des avis vérifiés.
          </p>
        </div>
      </section>

      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="rating-summary reveal">
            <div className="rating-score">
              <div className="num">4,7</div>
              <div className="stars">★★★★★</div>
              <div className="count">sur 1 284 avis</div>
            </div>
            <div className="rating-bars">
              {BARS.map(([label, pct]) => (
                <div className="bar-row" key={label}>
                  <span>{label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span>{pct} %</span>
                </div>
              ))}
            </div>
          </div>

          <div className="reviews-grid">
            {REVIEWS.map(([initials, name, when, stars, text]) => (
              <article className="review reveal" key={name}>
                <div className="review-head">
                  <div className="avatar">{initials}</div>
                  <div>
                    <div className="who">{name}</div>
                    <div className="when">{when}</div>
                  </div>
                </div>
                <div className="stars">
                  {"★".repeat(stars)}
                  {"☆".repeat(5 - stars)}
                </div>
                <p>{text}</p>
              </article>
            ))}
          </div>

          <div className="cta-band reveal" style={{ marginTop: 56 }}>
            <h2>Envie de vous faire votre propre avis ?</h2>
            <p className="lead">
              Rejoignez la communauté NexoraTV et partagez votre expérience.
            </p>
            <div className="hero-actions">
              <Link href="/inscription" className="btn btn-primary">
                Créer mon compte
              </Link>
              <Link href="/tuto" className="btn btn-ghost">
                Voir le tuto
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
