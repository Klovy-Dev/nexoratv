import type { Metadata } from "next";
import Callout from "@/components/Callout";
import CompatList from "@/components/CompatList";
import { SectionTitle } from "@/components/DocsSection";
import DocsPager from "@/components/DocsPager";
import TutoToc from "@/components/TutoToc";

export const metadata: Metadata = { title: "Appareils compatibles — Tuto" };

const SECTIONS = [
  { id: "televiseurs", label: "Téléviseurs" },
  { id: "boitiers", label: "Box & Fire Stick" },
];

export default function AppareilsPage() {
  return (
    <>
      <div className="docs-content">
        <h1 className="docs-h1">Appareils compatibles</h1>
        <p className="docs-intro">
          Vérifiez ci-dessous si votre téléviseur, votre box ou votre Fire
          Stick est pris en charge — et par quelle méthode.
        </p>

        <article className="docs-section" id="televiseurs">
          <SectionTitle id="televiseurs" kicker="Compatibilité" title="Téléviseurs" />
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
              {
                title: "LG (webOS)",
                note: "via l'application Smart TV uniquement (activation par adresse MAC) — voir Choisir son application",
              },
            ]}
            no={[
              {
                title: "Samsung (Tizen)",
                note: "le fabricant bloque toutes les applications IPTV, sans exception — un boîtier externe est obligatoire",
              },
              {
                title: "Téléviseurs « non smart »",
                note: "aucun magasin d'applications : un boîtier externe est indispensable",
              },
            ]}
          />
          <Callout type="tip">
            Sur Samsung ou tout téléviseur non pris en charge, branchez un{" "}
            <strong>Amazon Fire Stick</strong> ou une <strong>box
            Android</strong> avec <strong>Ibogold</strong> sur le port HDMI :
            ça fonctionne quel que soit le téléviseur.
          </Callout>
        </article>

        <article className="docs-section" id="boitiers">
          <SectionTitle id="boitiers" kicker="Compatibilité" title="Box & Fire Stick" />
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
                note: "via une application compatible sur l'App Store tvOS, choix plus limité que sur Android",
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
