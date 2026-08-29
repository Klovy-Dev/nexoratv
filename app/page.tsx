import Link from "next/link";

const FEATURES = [
  ["📺", "Catalogue immense", "Chaînes internationales, sport, cinéma, jeunesse et documentaires réunis dans une seule application."],
  ["⚡", "Zapping instantané", "Serveurs optimisés et anti-freeze pour un démarrage des flux en moins d'une seconde."],
  ["🖥️", "Multi-appareils", "Smart TV, Android, iOS, Fire Stick, box et ordinateur : votre compte vous suit partout."],
  ["🎬", "VOD & replay", "Des milliers de films et séries à la demande, mis à jour chaque semaine."],
  ["🔒", "Connexion stable", "Infrastructure redondée avec compatibilité VPN pour une lecture fiable en toutes circonstances."],
  ["💬", "Support réactif", "Une équipe joignable 7j/7 par messagerie pour vous accompagner à chaque étape."],
];

const STEPS = [
  ["1", "Créez votre compte", "Inscrivez-vous en une minute et choisissez la formule qui vous convient."],
  ["2", "Installez l'application", "Suivez notre tuto pas à pas selon votre appareil. Aucune compétence technique requise."],
  ["3", "Profitez", "Retrouvez vos identifiants sur votre profil, connectez-vous et lancez votre premier programme."],
];

export default function HomePage() {
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
            <Link href="/tuto" className="btn btn-ghost">
              Voir le tuto
            </Link>
          </div>
          <div className="hero-stats">
            <div><strong>+20 000</strong><span>chaînes en direct</span></div>
            <div><strong>100 000+</strong><span>films &amp; séries</span></div>
            <div><strong>4K</strong><span>jusqu&apos;à l&apos;Ultra HD</span></div>
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
            {FEATURES.map(([icon, title, text]) => (
              <div className="card reveal" key={title}>
                <div className="card-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "var(--bg-soft)" }}>
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">En 3 étapes</span>
            <h2>Installé en moins de 5 minutes</h2>
          </div>
          <div className="grid">
            {STEPS.map(([num, title, text]) => (
              <div className="card reveal" key={num}>
                <div className="card-icon">{num}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="center mt-40 reveal">
            <Link href="/tuto" className="btn btn-ghost">
              Consulter le guide complet →
            </Link>
          </div>
        </div>
      </section>

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
