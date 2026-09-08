import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confidentialité — Application NexoraTV",
  description:
    "Politique de confidentialité de l'application mobile NexoraTV (iOS, Android). L'application ne collecte aucune donnée personnelle.",
};

export default function ConfidentialiteApplicationPage() {
  const today = new Date().toLocaleDateString("fr-FR");
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Application mobile</span>
          <h1>Politique de confidentialité — Application NexoraTV</h1>
        </div>
      </section>
      <section style={{ paddingTop: 30 }}>
        <div className="container legal">
          <p className="updated">Dernière mise à jour : {today}</p>

          <p>
            Cette politique concerne l&apos;application <strong>NexoraTV</strong>{" "}
            (iOS et Android), un lecteur multimédia permettant de lire une source
            IPTV (compte Xtream Codes ou playlist) configurée par
            l&apos;utilisateur. Elle est distincte de la{" "}
            <Link href="/confidentialite">
              politique de confidentialité du site web
            </Link>
            .
          </p>

          <h2>1. Aucune donnée personnelle collectée</h2>
          <p>
            L&apos;application ne collecte, ne transmet et ne stocke aucune donnée
            personnelle sur nos serveurs. Elle ne nécessite pas de compte pour
            fonctionner. Aucun outil de mesure d&apos;audience, aucun traceur
            publicitaire et aucun kit de suivi tiers n&apos;y sont intégrés.
          </p>

          <h2>2. Données stockées sur votre appareil uniquement</h2>
          <ul>
            <li>
              Les sources que vous ajoutez : adresse du serveur, identifiant et
              mot de passe de votre abonnement. Le mot de passe est conservé dans
              le stockage sécurisé du système (Trousseau iOS / Keystore Android).
            </li>
            <li>Vos favoris, votre historique de lecture et vos réglages.</li>
            <li>
              Un cache local des listes de chaînes pour accélérer
              l&apos;affichage et permettre un fonctionnement hors ligne
              temporaire.
            </li>
          </ul>
          <p>
            Ces données restent sur votre appareil. Elles ne nous sont jamais
            envoyées et nous n&apos;y avons pas accès.
          </p>

          <h2>3. Connexions réseau</h2>
          <p>
            L&apos;application se connecte uniquement aux serveurs que vous
            renseignez vous-même (votre fournisseur d&apos;abonnement ou de
            playlist), afin de récupérer la liste des contenus et de lire les
            flux. Ces échanges ont lieu directement entre votre appareil et ce
            serveur.
          </p>

          <h2>4. Autorisations</h2>
          <ul>
            <li>
              <strong>Réseau local</strong> (iOS) : uniquement si votre source est
              hébergée sur votre réseau domestique.
            </li>
            <li>
              <strong>Stockage / installation</strong> (Android) : uniquement pour
              la fonction de mise à jour de l&apos;application, lorsqu&apos;elle
              est distribuée hors magasin.
            </li>
          </ul>

          <h2>5. Services tiers</h2>
          <p>
            La distribution via l&apos;App Store (Apple) et Google Play (Google)
            peut donner lieu à la collecte de statistiques agrégées par ces
            plateformes, selon leurs propres politiques, indépendamment de
            l&apos;application.
          </p>

          <h2>6. Enfants</h2>
          <p>
            L&apos;application ne s&apos;adresse pas aux enfants et ne collecte
            sciemment aucune donnée les concernant.
          </p>

          <h2>7. Suppression des données</h2>
          <p>
            Désinstaller l&apos;application efface l&apos;ensemble des données
            locales décrites ci-dessus.
          </p>

          <h2>8. Modifications</h2>
          <p>
            Cette politique peut être mise à jour. La date de dernière mise à jour
            figure en haut de page.
          </p>

          <h2>9. Contact</h2>
          <p>
            Pour toute question relative à cette politique, utilisez la page{" "}
            <Link href="/contact">Contact</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
