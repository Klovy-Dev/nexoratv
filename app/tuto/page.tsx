import Link from "next/link";
import type { Metadata } from "next";
import { listPublishedTutoSections } from "@/lib/data";
import { markdownToHtml } from "@/lib/tuto-format";

export const metadata: Metadata = {
  title: "Tuto — Installation & prise en main",
  description:
    "Guides d'installation et de configuration de NexoraTV : application, Xtream Codes, dépannage.",
};

// Régénère la page quand l'admin modifie une section (revalidatePath) ou
// au plus toutes les 5 min.
export const revalidate = 300;

export default async function TutoPage() {
  const sections = await listPublishedTutoSections();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Tuto</span>
          <h1>
            Installation &amp; <span className="gradient-text">prise en main</span>
          </h1>
          <p className="lead" style={{ marginInline: "auto" }}>
            Suivez les guides ci-dessous pour installer et configurer NexoraTV.
            Une question&nbsp;? L&apos;équipe reste joignable.
          </p>
        </div>
      </section>

      <section style={{ paddingTop: 40 }}>
        <div className="container" style={{ maxWidth: 780 }}>
          {sections.length === 0 ? (
            <div className="panel reveal" style={{ textAlign: "center" }}>
              <h2>Guides en préparation</h2>
              <p className="muted">
                Les tutoriels d&apos;installation arrivent très bientôt. En
                attendant, contactez-nous pour être accompagné.
              </p>
            </div>
          ) : (
            <div className="tuto-sections">
              {sections.map((s) => (
                <article key={s.id} className="panel reveal tuto-section">
                  <h2>
                    {s.icon && (
                      <span className="tuto-section-icon">{s.icon}</span>
                    )}
                    {s.title}
                  </h2>
                  {s.description && (
                    <p className="tuto-section-desc">{s.description}</p>
                  )}
                  <div
                    className="tuto-section-body"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(s.body) }}
                  />
                </article>
              ))}
            </div>
          )}

          <div className="cta-band reveal" style={{ marginTop: 48 }}>
            <h2>Besoin d&apos;aide&nbsp;?</h2>
            <p className="lead">
              Notre équipe vous guide pas à pas pour la mise en route.
            </p>
            <div className="hero-actions">
              <Link href="/contact" className="btn btn-primary">
                Nous contacter
              </Link>
              <Link href="/commander" className="btn btn-ghost">
                Voir les offres
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
