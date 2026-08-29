import type { Metadata } from "next";
import Callout from "@/components/Callout";
import { SectionTitle } from "@/components/DocsSection";
import DocsPager from "@/components/DocsPager";
import TutoToc from "@/components/TutoToc";

export const metadata: Metadata = { title: "Se connecter — Tuto" };

const SECTIONS = [
  { id: "playlist", label: "Ajouter votre playlist" },
  { id: "premier-lancement", label: "Premier lancement" },
];

export default function ConnexionPage() {
  return (
    <>
      <div className="docs-content">
        <h1 className="docs-h1">Se connecter à l&apos;application</h1>
        <p className="docs-intro">
          Une fois votre application installée (voir{" "}
          <a href="/tuto/applications">Choisir son application</a>), il ne
          reste plus qu&apos;à y ajouter vos identifiants.
        </p>

        <article className="docs-section" id="playlist">
          <SectionTitle id="playlist" kicker="Étape" title="Ajouter votre playlist" />
          <p>Ouvrez l&apos;application et ajoutez une nouvelle playlist :</p>
          <ul>
            <li>Choisissez le mode <strong>« Xtream Codes »</strong> ou <strong>« identifiants »</strong>.</li>
            <li>Recopiez l&apos;URL du serveur, le nom d&apos;utilisateur et le mot de passe depuis votre profil (bouton « Copier »).</li>
            <li>Donnez un nom au profil (ex. « NexoraTV Salon ») puis validez.</li>
          </ul>
          <Callout type="warning">
            Respectez les majuscules et minuscules. La plupart des erreurs de
            connexion viennent d&apos;un caractère mal recopié — d&apos;où
            l&apos;intérêt du bouton « Copier ».
          </Callout>
        </article>

        <article className="docs-section" id="premier-lancement">
          <SectionTitle id="premier-lancement" kicker="Étape" title="Premier lancement" />
          <p>
            L&apos;application charge la liste des chaînes et de la VOD. Ce
            premier chargement peut prendre jusqu&apos;à une minute.
          </p>
          <ul>
            <li>Parcourez les catégories : direct, films, séries.</li>
            <li>Ajoutez vos chaînes préférées aux favoris.</li>
            <li>Activez le rafraîchissement automatique de la liste dans les réglages.</li>
          </ul>
          <Callout type="success">
            En cas de coupure, contactez le support 24/7.
          </Callout>
        </article>

        <DocsPager />
      </div>

      <TutoToc items={SECTIONS} />
    </>
  );
}
