import Link from "next/link";

export default function NotFound() {
  return (
    <section className="hero">
      <div className="container">
        <span className="eyebrow">Erreur 404</span>
        <h1>
          Cette page <span className="gradient-text">n&apos;existe pas</span>
        </h1>
        <p className="lead" style={{ marginInline: "auto" }}>
          Le lien est peut-être erroné ou la page a été déplacée.
        </p>
        <div className="hero-actions">
          <Link href="/" className="btn btn-primary">
            Retour à l&apos;accueil
          </Link>
          <Link href="/contact" className="btn btn-ghost">
            Contacter le support
          </Link>
        </div>
      </div>
    </section>
  );
}
