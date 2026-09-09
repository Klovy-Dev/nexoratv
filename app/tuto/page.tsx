import Link from "next/link";
import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import { listPublishedTutoSections } from "@/lib/data";

export const metadata: Metadata = {
  title: "Tuto — Installation & prise en main",
  description:
    "Guides d'installation et de configuration de NexoraTV : application, Xtream Codes, dépannage.",
};

// Régénère la page quand l'admin modifie une section (revalidatePath) ou
// au plus toutes les 5 min.
export const revalidate = 300;

/* -------- Rendu du corps de texte des sections -------- */

function inline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = /^\*\*([^*]+)\*\*$/.exec(part);
    return m ? (
      <strong key={`${keyPrefix}-${i}`}>{m[1]}</strong>
    ) : (
      <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>
    );
  });
}

function renderBody(body: string): ReactNode[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, i) => (
      <li key={i}>{inline(it, `li-${key}-${i}`)}</li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={`b${key++}`} className="tuto-steps">
          {items}
        </ol>
      ) : (
        <ul key={`b${key++}`} className="tuto-list">
          {items}
        </ul>
      ),
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const step = /^\d+[.)]\s+(.*)$/.exec(line);
    if (bullet) {
      if (list && list.ordered) flushList();
      list ??= { ordered: false, items: [] };
      list.items.push(bullet[1]);
    } else if (step) {
      if (list && !list.ordered) flushList();
      list ??= { ordered: true, items: [] };
      list.items.push(step[1]);
    } else {
      flushList();
      blocks.push(<p key={`b${key++}`}>{inline(line, `p${key}`)}</p>);
    }
  }
  flushList();
  return blocks;
}

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
                  {renderBody(s.body)}
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
