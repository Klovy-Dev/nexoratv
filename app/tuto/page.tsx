import Link from "next/link";
import type { Metadata } from "next";
import Callout from "@/components/Callout";
import { SectionTitle } from "@/components/DocsSection";
import DocsPager from "@/components/DocsPager";
import TutoToc from "@/components/TutoToc";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation";

export const metadata: Metadata = { title: "Créer votre compte — Tuto" };

const SECTIONS = [
  { id: "compte", label: "Créer votre compte" },
  { id: "identifiants", label: "Récupérer vos identifiants" },
];

export default function TutoPage() {
  return (
    <>
      <div className="docs-content">
        <h1 className="docs-h1">Bienvenue sur le guide NexoraTV</h1>
        <p className="docs-intro">
          Trois étapes suffisent pour regarder NexoraTV : créer votre compte,
          installer l&apos;application adaptée à votre appareil, puis vous
          connecter avec vos identifiants. Aucune compétence technique
          n&apos;est nécessaire.
        </p>

        <article className="docs-section" id="compte">
          <SectionTitle id="compte" kicker="Étape 1" title="Créer votre compte" />
          <p>
            Rendez-vous sur la page d&apos;inscription, renseignez votre nom,
            votre e-mail et un mot de passe sécurisé, puis validez.
          </p>
          <ul>
            <li>Utilisez une adresse e-mail que vous consultez régulièrement.</li>
            <li>
              Choisissez un mot de passe d&apos;au moins {PASSWORD_MIN_LENGTH}{" "}
              caractères, avec lettres et chiffres.
            </li>
          </ul>
          <Callout type="tip">
            Une fois inscrit, un administrateur associe votre abonnement à
            votre compte. Vos identifiants apparaissent alors sur votre
            profil.
          </Callout>
        </article>

        <article className="docs-section" id="identifiants">
          <SectionTitle id="identifiants" kicker="Étape 2" title="Récupérer vos identifiants" />
          <p>
            Connectez-vous et ouvrez la page{" "}
            <Link href="/profil"><strong>Mon profil</strong></Link>. Vous y
            trouvez, pour chaque abonnement actif :
          </p>
          <ul>
            <li><strong>URL du serveur</strong> (ou « host »)</li>
            <li><strong>Nom d&apos;utilisateur</strong></li>
            <li><strong>Mot de passe</strong></li>
            <li><strong>Date d&apos;expiration</strong></li>
          </ul>
          <Callout type="danger">
            Ne partagez jamais ces informations. Un compte est prévu pour un
            foyer et un nombre limité d&apos;écrans simultanés.
          </Callout>
        </article>

        <DocsPager />
      </div>

      <TutoToc items={SECTIONS} />
    </>
  );
}
