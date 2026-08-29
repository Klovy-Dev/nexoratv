import type { Metadata } from "next";
import Callout from "@/components/Callout";
import { SectionTitle } from "@/components/DocsSection";
import DocsPager from "@/components/DocsPager";
import TutoToc from "@/components/TutoToc";

export const metadata: Metadata = { title: "Choisir son application — Tuto" };

const SECTIONS = [
  { id: "android-tv", label: "Android TV / Google TV" },
  { id: "fire-tv", label: "Amazon Fire TV & Fire Stick" },
  { id: "samsung-lg", label: "Samsung & LG" },
  { id: "android", label: "Android (téléphone)" },
  { id: "ios", label: "iPhone / iPad" },
  { id: "ordinateur", label: "Ordinateur" },
];

export default function ApplicationsPage() {
  return (
    <>
      <div className="docs-content">
        <h1 className="docs-h1">Choisir son application</h1>
        <p className="docs-intro">
          NexoraTV fonctionne avec la plupart des applications IPTV du marché,
          en mode <strong>« Xtream Codes »</strong> (URL du serveur + nom
          d&apos;utilisateur + mot de passe). Choisissez ci-dessous
          l&apos;application recommandée pour votre appareil.
        </p>

        <article className="docs-section" id="android-tv">
          <SectionTitle id="android-tv" kicker="Smart TV & box" title="Android TV / Google TV" />
          <p>
            Ouvrez le <strong>Play Store</strong>, recherchez{" "}
            <strong>IPTV Smarters Pro</strong>, installez-la puis lancez-la.
            Choisissez « Se connecter avec Xtream Codes API » et renseignez
            les identifiants de votre profil.
          </p>
          <Callout type="tip">
            Vous préférez un guide de chaînes (EPG) plus complet ?{" "}
            <strong>TiviMate</strong> est une excellente alternative sur
            Android TV — ajoutez votre playlist manuellement avec les mêmes
            identifiants.
          </Callout>
        </article>

        <article className="docs-section" id="fire-tv">
          <SectionTitle id="fire-tv" kicker="Box" title="Amazon Fire TV & Fire Stick" />
          <p>
            Depuis l&apos;écran d&apos;accueil, ouvrez l&apos;<strong>Appstore</strong>{" "}
            et recherchez <strong>IPTV Smarters Pro</strong> (ou{" "}
            <strong>TiviMate</strong>). Installez, ouvrez, puis connectez-vous
            en mode Xtream Codes.
          </p>
          <Callout type="info">
            Application introuvable dans votre région ? Installez{" "}
            <strong>Downloader</strong> depuis l&apos;Appstore : il permet
            d&apos;ajouter n&apos;importe quelle application Android par son
            lien direct.
          </Callout>
        </article>

        <article className="docs-section" id="samsung-lg">
          <SectionTitle id="samsung-lg" kicker="Smart TV" title="Samsung & LG (Tizen / webOS)" />
          <p>
            Ces téléviseurs n&apos;ont pas de Play Store : utilisez{" "}
            <strong>Smart IPTV</strong> (SIPTV), disponible dans leur magasin
            d&apos;applications respectif. L&apos;activation se fait par
            adresse MAC sur{" "}
            <span style={{ color: "var(--text)" }}>siptv.app</span>, un mode
            différent des identifiants Xtream Codes habituels.
          </p>
          <Callout type="warning">
            Expérience plus limitée que sur Android TV (pas d&apos;EPG
            complet, activation à refaire si vous changez de TV). La solution
            la plus simple reste de brancher un boîtier externe — voir{" "}
            <a href="/tuto/boitiers">Box &amp; Fire Stick</a>.
          </Callout>
        </article>

        <article className="docs-section" id="android">
          <SectionTitle id="android" kicker="Mobile" title="Android (téléphone / tablette)" />
          <p>
            Installez <strong>IPTV Smarters Pro</strong> ou{" "}
            <strong>GSE Smart IPTV</strong> depuis le Play Store, puis
            connectez-vous en mode Xtream Codes avec vos identifiants.
          </p>
        </article>

        <article className="docs-section" id="ios">
          <SectionTitle id="ios" kicker="Mobile" title="iPhone / iPad" />
          <p>
            Installez <strong>IPTV Smarters Pro</strong> ou{" "}
            <strong>GSE Smart IPTV</strong> depuis l&apos;App Store, puis
            connectez-vous en mode Xtream Codes avec vos identifiants.
          </p>
        </article>

        <article className="docs-section" id="ordinateur">
          <SectionTitle id="ordinateur" kicker="Bureau" title="Ordinateur (Windows / macOS)" />
          <p>
            Utilisez l&apos;application de bureau <strong>IPTV Smarters
            Pro</strong>, ou lisez directement votre playlist avec{" "}
            <strong>VLC</strong> (Média → Ouvrir un flux réseau → URL de
            playlist depuis votre profil).
          </p>
        </article>

        <DocsPager />
      </div>

      <TutoToc items={SECTIONS} />
    </>
  );
}
