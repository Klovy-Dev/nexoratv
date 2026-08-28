import Link from "next/link";
import type { Metadata } from "next";
import Faq, { type FaqEntry } from "@/components/Faq";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation";

export const metadata: Metadata = { title: "Tuto d'installation" };

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

export default function TutoPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Guide d&apos;installation</span>
          <h1>
            Installez NexoraTV{" "}
            <span className="gradient-text">en quelques minutes</span>
          </h1>
          <p className="lead" style={{ marginInline: "auto" }}>
            Suivez les étapes dans l&apos;ordre. Aucune compétence technique
            n&apos;est nécessaire : chaque étape est expliquée simplement.
          </p>
        </div>
      </section>

      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="tuto-layout">
            <nav className="tuto-nav reveal">
              <h4>Sommaire</h4>
              <ol>
                <li><a href="#etape-1">1. Créer votre compte</a></li>
                <li><a href="#etape-2">2. Récupérer vos identifiants</a></li>
                <li><a href="#etape-3">3. Installer l&apos;application</a></li>
                <li><a href="#etape-4">4. Se connecter</a></li>
                <li><a href="#etape-5">5. Premier lancement</a></li>
                <li><a href="#faq">Questions fréquentes</a></li>
              </ol>
            </nav>

            <div>
              <article className="step reveal" id="etape-1">
                <span className="step-num">1</span>
                <h3>Créer votre compte</h3>
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
                <div className="callout">
                  <span>💡</span>
                  <span>
                    Une fois inscrit, un administrateur associe votre abonnement à
                    votre compte. Vos identifiants apparaissent alors sur votre
                    profil.
                  </span>
                </div>
              </article>

              <article className="step reveal" id="etape-2">
                <span className="step-num">2</span>
                <h3>Récupérer vos identifiants</h3>
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
                <div className="callout">
                  <span>🔒</span>
                  <span>
                    Ne partagez jamais ces informations. Un compte est prévu pour
                    un foyer et un nombre limité d&apos;écrans simultanés.
                  </span>
                </div>
              </article>

              <article className="step reveal" id="etape-3">
                <span className="step-num">3</span>
                <h3>Installer l&apos;application</h3>
                <p>Choisissez la méthode correspondant à votre appareil :</p>
                <ul>
                  <li><strong>Smart TV (Android TV / Google TV)</strong> : ouvrez le Play Store, installez un lecteur IPTV compatible.</li>
                  <li><strong>Amazon Fire Stick</strong> : recherchez l&apos;application dans l&apos;Appstore et installez-la.</li>
                  <li><strong>Android (téléphone / tablette)</strong> : téléchargez l&apos;application depuis le Play Store.</li>
                  <li><strong>iPhone / iPad</strong> : installez un lecteur compatible depuis l&apos;App Store.</li>
                  <li><strong>Ordinateur</strong> : utilisez un lecteur de bureau compatible.</li>
                </ul>
                <div className="callout">
                  <span>📶</span>
                  <span>Débit conseillé : 15 Mbps pour la HD, 25 Mbps pour la 4K.</span>
                </div>
              </article>

              <article className="step reveal" id="etape-4">
                <span className="step-num">4</span>
                <h3>Se connecter</h3>
                <p>Ouvrez l&apos;application et ajoutez une nouvelle playlist :</p>
                <ul>
                  <li>Choisissez le mode <strong>« Xtream Codes »</strong> ou <strong>« identifiants »</strong>.</li>
                  <li>Recopiez l&apos;URL du serveur, le nom d&apos;utilisateur et le mot de passe depuis votre profil (bouton « Copier »).</li>
                  <li>Donnez un nom au profil (ex. « NexoraTV Salon ») puis validez.</li>
                </ul>
                <div className="callout">
                  <span>⚠️</span>
                  <span>
                    Respectez les majuscules et minuscules. La plupart des erreurs
                    de connexion viennent d&apos;un caractère mal recopié — d&apos;où
                    l&apos;intérêt du bouton « Copier ».
                  </span>
                </div>
              </article>

              <article className="step reveal" id="etape-5">
                <span className="step-num">5</span>
                <h3>Premier lancement</h3>
                <p>
                  L&apos;application charge la liste des chaînes et de la VOD. Ce
                  premier chargement peut prendre jusqu&apos;à une minute.
                </p>
                <ul>
                  <li>Parcourez les catégories : direct, films, séries.</li>
                  <li>Ajoutez vos chaînes préférées aux favoris.</li>
                  <li>Activez le rafraîchissement automatique de la liste dans les réglages.</li>
                </ul>
                <div className="callout">
                  <span>✅</span>
                  <span>
                    En cas de coupure, changez de serveur dans les réglages ou
                    contactez le support 24/7.
                  </span>
                </div>
              </article>

              <div id="faq" style={{ scrollMarginTop: 96, marginTop: 56 }}>
                <div
                  className="section-head reveal"
                  style={{ textAlign: "left", marginBottom: 28 }}
                >
                  <span className="eyebrow">Besoin d&apos;aide ?</span>
                  <h2>Questions fréquentes</h2>
                </div>
                <Faq items={FAQ} />
              </div>

              <div className="cta-band reveal" style={{ marginTop: 56 }}>
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
          </div>
        </div>
      </section>
    </>
  );
}
