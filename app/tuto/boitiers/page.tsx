import type { Metadata } from "next";
import Callout from "@/components/Callout";
import CompatList from "@/components/CompatList";
import { SectionTitle } from "@/components/DocsSection";
import DocsPager from "@/components/DocsPager";
import TutoToc from "@/components/TutoToc";

export const metadata: Metadata = { title: "Box & Fire Stick compatibles — Tuto" };

const SECTIONS = [{ id: "compatibilite", label: "Compatibilité des boîtiers" }];

export default function BoitiersPage() {
  return (
    <>
      <div className="docs-content">
        <h1 className="docs-h1">Box TV &amp; Fire Stick compatibles</h1>
        <p className="docs-intro">
          Un boîtier externe branché en HDMI est la solution la plus simple et
          la plus fiable, quel que soit votre téléviseur. Voici les modèles à
          privilégier et ceux à éviter.
        </p>

        <article className="docs-section" id="compatibilite">
          <SectionTitle id="compatibilite" kicker="Compatibilité" title="Ce qui fonctionne, et ce qui ne fonctionne pas" />
          <CompatList
            ok={[
              {
                title: "Amazon Fire TV Stick",
                note: "toutes générations : Lite, 4K, 4K Max, ainsi que Fire TV Cube — installez Ibogold via l'Appstore",
              },
              {
                title: "Boîtiers Android TV / Google TV",
                note: "Nvidia Shield, Xiaomi Mi Box, Chromecast avec Google TV, TCL/Onn… installez Ibogold",
              },
              {
                title: "Apple TV",
                note: "via une application compatible sur l'App Store tvOS (choix plus limité que sur Android)",
              },
            ]}
            no={[
              {
                title: "Chromecast 1ʳᵉ / 2ᵉ génération",
                note: "sans Google TV : aucune application installable, diffusion (« cast ») uniquement depuis un téléphone",
              },
              {
                title: "Boîtiers Android très anciens",
                note: "Android antérieur à 7 ou moins de 1,5 Go de RAM : lags et plantages fréquents",
              },
              {
                title: "Box MAG, Formuler, Enigma2",
                note: "fonctionnent par portail STB et non par identifiants Xtream Codes — non prises en charge par notre support",
              },
            ]}
          />
          <Callout type="warning">
            Privilégiez un appareil récent avec au moins 1,5 à 2 Go de RAM
            pour un affichage fluide en HD et en 4K.
          </Callout>
        </article>

        <DocsPager />
      </div>

      <TutoToc items={SECTIONS} />
    </>
  );
}
