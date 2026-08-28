export default function LegalShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  const today = new Date().toLocaleDateString("fr-FR");
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
        </div>
      </section>
      <section style={{ paddingTop: 30 }}>
        <div className="container legal">
          <p className="updated">Dernière mise à jour : {today}</p>
          {children}
          <p className="muted" style={{ marginTop: 36, fontSize: "0.85rem" }}>
            Modèle indicatif à compléter (champs entre crochets) et à faire
            valider juridiquement avant mise en production.
          </p>
        </div>
      </section>
    </>
  );
}
