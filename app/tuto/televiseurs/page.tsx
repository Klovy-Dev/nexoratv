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
          d&apos;autres nécessitent un boîtier externe. Vérifiez votre modèle
          ci-dessous.
        </p>

        <article className="docs-section" id="compatibilite">
          <SectionTitle id="compatibilite" kicker="Compatibilité" title="Ce qui fonctionne, et ce qui ne fonctionne pas" />
          <CompatList
            ok={[
              {
                title: "Android TV / Google TV",
                note: "Sony, TCL, Hisense, Philips, Sharp… installez IPTV Smarters directement depuis le Play Store",
              },
              {
                title: "Téléviseurs Amazon Fire TV",
                note: "magasin d'applications Amazon intégré, même principe qu'un Fire Stick",
              },
            ]}
            no={[
              {
                title: "Samsung (Tizen)",
                note: "le fabricant bloque toutes les applications IPTV, sans exception — un boîtier externe est obligatoire",
              },
              {
                title: "LG (webOS)",
                note: "aucune de nos applications n'est disponible sur son magasin — un boîtier externe est nécessaire",
              },
              {
                title: "Téléviseurs « non smart »",
                note: "aucun magasin d'applications : un boîtier externe est indispensable",
              },
            ]}
          />
          <Callout type="tip">
            Sur Samsung, LG ou tout téléviseur non pris en charge, branchez un{" "}
            <strong>Amazon Fire Stick</strong> ou une <strong>box
            Android</strong> avec <strong>Ibogold</strong> sur le port HDMI :
            ça fonctionne quel que soit le téléviseur. Détails sur{" "}
            <a href="/tuto/boitiers">Box &amp; Fire Stick compatibles</a>.
          </Callout>
        </article>

        <DocsPager />
      </div>

      <TutoToc items={SECTIONS} />
    </>
  );
}
