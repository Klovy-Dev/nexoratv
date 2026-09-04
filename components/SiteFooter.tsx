import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="NexoraTV" className="brand-logo" width={36} height={36} />
              <span>
                Nexora<span className="brand-accent">TV</span>
              </span>
            </Link>
            <p>
              Le streaming nouvelle génération : simple, rapide et accessible sur
              tous vos écrans.
            </p>
          </div>
          <div className="footer-col">
            <h5>Navigation</h5>
            <Link href="/">Accueil</Link>
            <Link href="/avis">Avis</Link>
            <Link href="/tuto">Tuto</Link>
            <Link href="/telecharger">Télécharger l&apos;app</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div className="footer-col">
            <h5>Compte</h5>
            <Link href="/connexion">Connexion</Link>
            <Link href="/inscription">Inscription</Link>
            <Link href="/profil">Mon profil</Link>
          </div>
          <div className="footer-col">
            <h5>Légal</h5>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/conditions">Conditions d&apos;utilisation</Link>
            <Link href="/cookies">Cookies</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} NexoraTV. Tous droits réservés.
          </span>
          <span>TV • Digital • Web • Apps</span>
        </div>
      </div>
    </footer>
  );
}
