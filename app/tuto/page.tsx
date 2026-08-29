import Link from "next/link";
import type { Metadata } from "next";
import Faq, { type FaqEntry } from "@/components/Faq";
import Callout from "@/components/Callout";
import { TutoSidebar, TutoToc, type DocGroup } from "@/components/TutoNav";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation";

export const metadata: Metadata = { title: "Tuto d'installation" };

const GROUPS: DocGroup[] = [
  {
    title: "Démarrage",
    items: [
      { id: "etape-1", label: "Créer votre compte" },
      { id: "etape-2", label: "Récupérer vos identifiants" },
      { id: "etape-3", label: "Installer l'application" },
      { id: "etape-4", label: "Se connecter" },
      { id: "etape-5", label: "Premier lancement" },
    ],
  },
  {
    title: "Aide",
    items: [{ id: "faq", label: "Questions fréquentes" }],
  },
];

const FAQ: FaqEntry[] = [
  {
    q: "Je n'ai pas d'identifiants sur mon profil, pourquoi ?",
    a: "Après l'inscription, un administrateur doit associer votre abonnement à votre compte. Si rien n'apparaît après votre paiement, contactez le support via la page Contact.",
  },
  {
    q: "L'image se fige régulièrement, comment corriger ?",
    a: "Testez votre débit, rapprochez l'appareil de la box ou utilisez un câble Ethernet. Dans l'application, changez de serveur puis relancez la chaîne.",
  },
  {
    q: "Puis-je utiliser mon compte sur plusieurs appareils ?",
    a: "Oui. Le nombre de lectures simultanées dépend de votre formule, mais vous pouvez configurer autant d'appareils que vous le souhaitez.",
  },
  {
    q: "Faut-il un VPN ?",
    a: "Ce n'est pas obligatoire. Si votre fournisseur d'accès limite certains flux, un VPN peut améliorer la stabilité.",
  },
  {
    q: "Comment renouveler mon abonnement ?",
    a: "Contactez le support ou votre revendeur. Vos identifiants restent identiques : aucune réinstallation n'est nécessaire.",
  },
];

function SectionTitle({ id, kicker, title }: { id: string; kicker: string; title: string }) {
  return (
    <>
      <span className="docs-kicker">{kicker}</span>
      <h2>
        {title}
        <a href={`#${id}`} className="docs-anchor" aria-label="Lien vers cette section">
          #
        </a>
      </h2>
    </>
  );
}

export default function TutoPage() {
  return (
    <section className="docs-shell">
      <div className="container">
        <div className="docs-breadcrumb">
          <span>Documentation</span>
          <span className="sep">/</span>
          <span className="current">Guide d&apos;installation</span>
        </div>

        <div className="docs-layout">
          <TutoSidebar groups={GROUPS} />

          <div className="docs-content">
            <h1 className="docs-h1">Installez NexoraTV</h1>
            <p className="docs-intro">
              Suivez les étapes dans l&apos;ordre. Aucune compétence technique
              n&apos;est nécessaire : chaque étape est expliquée simplement.
            </p>

            <article className="docs-section" id="etape-1">
              <SectionTitle id="etape-1" kicker="Étape 1" title="Créer votre compte" />
              <p>
                Rendez-vous sur la page d&apos;inscription, renseignez votre
                nom, votre e-mail et un mot de passe sécurisé, puis validez.
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

            <article className="docs-section" id="etape-2">
              <SectionTitle id="etape-2" kicker="Étape 2" title="Récupérer vos identifiants" />
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
                Ne partagez jamais ces informations. Un compte est prévu pour
                un foyer et un nombre limité d&apos;écrans simultanés.
              </Callout>
            </article>

            <article className="docs-section" id="etape-3">
              <SectionTitle id="etape-3" kicker="Étape 3" title="Installer l'application" />
              <p>Choisissez la méthode correspondant à votre appareil :</p>
              <ul>
                <li><strong>Smart TV (Android TV / Google TV)</strong> : ouvrez le Play Store, installez un lecteur IPTV compatible.</li>
                <li><strong>Amazon Fire Stick</strong> : recherchez l&apos;application dans l&apos;Appstore et installez-la.</li>
                <li><strong>Android (téléphone / tablette)</strong> : téléchargez l&apos;application depuis le Play Store.</li>
                <li><strong>iPhone / iPad</strong> : installez un lecteur compatible depuis l&apos;App Store.</li>
                <li><strong>Ordinateur</strong> : utilisez un lecteur de bureau compatible.</li>
              </ul>
              <Callout type="info">Débit conseillé : 15 Mbps pour la HD, 25 Mbps pour la 4K.</Callout>
            </article>

            <article className="docs-section" id="etape-4">
              <SectionTitle id="etape-4" kicker="Étape 4" title="Se connecter" />
              <p>Ouvrez l&apos;application et ajoutez une nouvelle playlist :</p>
              <ul>
                <li>Choisissez le mode <strong>« Xtream Codes »</strong> ou <strong>« identifiants »</strong>.</li>
                <li>Recopiez l&apos;URL du serveur, le nom d&apos;utilisateur et le mot de passe depuis votre profil (bouton « Copier »).</li>
                <li>Donnez un nom au profil (ex. « NexoraTV Salon ») puis validez.</li>
              </ul>
              <Callout type="warning">
                Respectez les majuscules et minuscules. La plupart des erreurs
                de connexion viennent d&apos;un caractère mal recopié — d&apos;où
                l&apos;intérêt du bouton « Copier ».
              </Callout>
            </article>

            <article className="docs-section" id="etape-5">
              <SectionTitle id="etape-5" kicker="Étape 5" title="Premier lancement" />
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
                En cas de coupure, changez de serveur dans les réglages ou
                contactez le support 24/7.
              </Callout>
            </article>

            <article className="docs-section" id="faq">
              <SectionTitle id="faq" kicker="Aide" title="Questions fréquentes" />
              <Faq items={FAQ} />
            </article>

            <div className="cta-band reveal" style={{ marginTop: 16 }}>
              <h2>Toujours bloqué ?</h2>
              <p className="lead">
                Notre support est disponible 7j/7. Décrivez votre appareil et le
                message d&apos;erreur, on s&apos;occupe du reste.
              </p>
              <div className="hero-actions">
                <Link href="/contact" className="btn btn-primary">
                  Contacter le support
                </Link>
                <Link href="/avis" className="btn btn-ghost">
                  Lire les avis
                </Link>
              </div>
            </div>
          </div>

          <TutoToc groups={GROUPS} />
        </div>
      </div>
    </section>
  );
}
