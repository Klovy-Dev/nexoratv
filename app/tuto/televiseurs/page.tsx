import type { Metadata } from "next";
import Callout from "@/components/Callout";
import CompatList from "@/components/CompatList";
import { SectionTitle } from "@/components/DocsSection";
import DocsPager from "@/components/DocsPager";
import TutoToc from "@/components/TutoToc";

export const metadata: Metadata = { title: "Téléviseurs compatibles — Tuto" };

const SECTIONS = [{ id: "compatibilite", label: "Compatibilité des téléviseurs" }];

export default function TeleviseursPage() {
  return (
    <>
      <div className="docs-content">
        <h1 className="docs-h1">Téléviseurs compatibles</h1>
        <p className="docs-intro">
          Certains téléviseurs installent l&apos;application IPTV directement,
          d&apos;autres nécessitent une méthode différente — voire un boîtier
          externe. Vérifiez votre modèle ci-dessous.
        </p>

        <article className="docs-section" id="compatibilite">
          <SectionTitle id="compatibilite" kicker="Compatibilité" title="Ce qui fonctionne, et ce qui ne fonctionne pas" />
          <CompatList
            ok={[
              {
                title: "Android TV / Google TV",
                note: "Sony, TCL, Hisense, Philips, Sharp… installez l'application directement depuis le Play Store",
              },
              {
                title: "Téléviseurs Amazon Fire TV",
                note: "magasin d'applications Amazon intégré, même principe qu'un Fire Stick",
              },
            ]}
            no={[
              {
                title: "Samsung (Tizen) & LG (webOS)",
                note: "pas de Play Store — utilisables via Smart IPTV ou un boîtier externe (voir ci-dessous)",
              },
              {
                title: "Téléviseurs « non smart »",
                note: "aucun magasin d'applications : un boîtier externe est indispensable",
              },
              {
                title: "Modèles antérieurs à 2016",
                note: "mémoire souvent insuffisante, application lente ou instable",
              },
            ]}
          />
          <Callout type="tip">
            Le moyen le plus simple de rendre <strong>n&apos;importe quel
            téléviseur</strong> compatible reste de brancher un boîtier
            Android TV ou un Fire TV Stick sur un port HDMI libre — consultez{" "}
            <a href="/tuto/boitiers">Box &amp; Fire Stick compatibles</a>.
          </Callout>
        </article>

        <DocsPager />
      </div>

      <TutoToc items={SECTIONS} />
    </>
  );
}
