import type { Metadata } from "next";
import Callout from "@/components/Callout";
import { SectionTitle } from "@/components/DocsSection";
import DocsPager from "@/components/DocsPager";
import TutoToc from "@/components/TutoToc";

export const metadata: Metadata = { title: "Choisir son application — Tuto" };

const SECTIONS = [
  { id: "telephone", label: "Téléphone (Android & iOS)" },
  { id: "box-firestick", label: "Box Android & Fire Stick" },
  { id: "android-tv", label: "Android TV / Google TV" },
  { id: "samsung", label: "Samsung" },
  { id: "lg", label: "LG" },
  { id: "ordinateur", label: "Ordinateur" },
];

export default function ApplicationsPage() {
  return (
    <>
      <div className="docs-content">
        <h1 className="docs-h1">Choisir son application</h1>
        <p className="docs-intro">
          Chez NexoraTV, nous recommandons une application précise selon votre
          appareil. Dans chacune, connectez-vous en mode{" "}
          <strong>« Xtream Codes »</strong> avec l&apos;URL du serveur, le nom
          d&apos;utilisateur et le mot de passe affichés sur votre profil.
        </p>

        <article className="docs-section" id="telephone">
          <SectionTitle id="telephone" kicker="Mobile" title="Téléphone (Android & iOS)" />
          <p>
            Installez <strong>Zen IPTV</strong> depuis le Play Store (Android)
            ou l&apos;App Store (iPhone), ouvrez l&apos;application, puis
            connectez-vous en mode Xtream Codes avec vos identifiants.
          </p>
        </article>

        <article className="docs-section" id="box-firestick">
          <SectionTitle id="box-firestick" kicker="Box" title="Box Android & Amazon Fire Stick" />
          <p>
            Installez <strong>Ibogold</strong> : sur un Fire Stick, recherchez
            l&apos;application dans l&apos;<strong>Appstore Amazon</strong> ;
            sur une box Android classique, téléchargez-la depuis le Play
            Store ou, si elle n&apos;y figure pas, via son APK officiel.
            Ouvrez-la puis connectez-vous avec vos identifiants.
          </p>
          <Callout type="info">
            Application introuvable dans l&apos;Appstore de votre Fire Stick ?
            Installez <strong>Downloader</strong> : il permet d&apos;ajouter
            n&apos;importe quelle application Android par son lien direct.
          </Callout>
        </article>

        <article className="docs-section" id="android-tv">
          <SectionTitle id="android-tv" kicker="Smart TV" title="Android TV / Google TV" />
          <p>
            Sur un téléviseur avec Android TV ou Google TV intégré (Sony,
            TCL, Hisense, Philips, Sharp…), ouvrez le <strong>Play
            Store</strong>, installez <strong>IPTV Smarters Player Lite</strong>{" "}
            (ou <strong>IPTV Smarters Pro</strong>), puis connectez-vous en
            mode Xtream Codes API avec vos identifiants.
          </p>
        </article>

        <article className="docs-section" id="samsung">
          <SectionTitle id="samsung" kicker="Smart TV" title="Samsung" />
          <Callout type="danger">
            Le fabricant bloque toutes les applications IPTV sur ses
            téléviseurs : aucune installation n&apos;est possible, quelle que
            soit l&apos;application.
          </Callout>
          <p>
            Seule solution : brancher un boîtier externe sur le port HDMI —
            un <strong>Amazon Fire Stick</strong> ou une <strong>box
            Android</strong> avec <strong>Ibogold</strong> installé
            fonctionnent parfaitement. Voir{" "}
            <a href="/tuto/appareils">Appareils compatibles</a>.
          </p>
        </article>

        <article className="docs-section" id="lg">
          <SectionTitle id="lg" kicker="Smart TV" title="LG (webOS)" />
          <p>
            Installez l&apos;application <strong>Smart TV</strong> depuis le
            LG Content Store, puis suivez la procédure d&apos;activation
            indiquée dans l&apos;application : elle se fait par adresse MAC,
            différemment de la connexion habituelle par identifiants.
          </p>
          <Callout type="tip">
            Besoin d&apos;aide pour l&apos;activation ? Contactez le support.
            Vous pouvez aussi brancher un boîtier externe (Fire Stick / box
            Android avec Ibogold) pour retrouver une connexion classique par
            identifiants.
          </Callout>
        </article>

        <article className="docs-section" id="ordinateur">
          <SectionTitle id="ordinateur" kicker="Bureau" title="Ordinateur (Windows / macOS)" />
          <p>
            Utilisez <strong>IPTV Smarters Player Lite</strong> ou{" "}
            <strong>IPTV Smarters Pro</strong> en version bureau, ou lisez
            directement votre playlist avec <strong>VLC</strong> (Média →
            Ouvrir un flux réseau → URL de playlist depuis votre profil).
          </p>
        </article>

        <DocsPager />
      </div>

      <TutoToc items={SECTIONS} />
    </>
  );
}
