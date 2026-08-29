import Link from "next/link";
import type { Metadata } from "next";
import Faq, { type FaqEntry } from "@/components/Faq";
import { SectionTitle } from "@/components/DocsSection";
import DocsPager from "@/components/DocsPager";
import TutoToc from "@/components/TutoToc";

export const metadata: Metadata = { title: "Questions fréquentes — Tuto" };

const SECTIONS = [{ id: "faq", label: "Questions fréquentes" }];

const FAQ: FaqEntry[] = [
  {
    q: "Je n'ai pas d'identifiants sur mon profil, pourquoi ?",
    a: "Après l'inscription, un administrateur doit associer votre abonnement à votre compte. Si rien n'apparaît après votre paiement, contactez le support via la page Contact.",
  },
  {
    q: "Mon téléviseur est un Samsung, comment faire ?",
    a: "Samsung bloque toutes les applications IPTV, sans exception. Branchez un Amazon Fire Stick ou une box Android avec Ibogold sur le port HDMI de votre téléviseur — ça fonctionne quel que soit le modèle. Détails sur la page « Choisir son application ».",
  },
  {
    q: "Mon téléviseur est un LG, comment faire ?",
    a: "Installez l'application Smart TV depuis le LG Content Store : l'activation se fait par adresse MAC plutôt qu'avec vos identifiants habituels. Vous pouvez aussi brancher un boîtier externe (Fire Stick / box Android avec Ibogold) pour une connexion classique. Détails sur la page « Choisir son application ».",
  },
  {
    q: "L'image se fige régulièrement, comment corriger ?",
    a: "Testez votre débit, rapprochez l'appareil de la box ou utilisez un câble Ethernet, puis relancez la chaîne.",
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

export default function FaqPage() {
  return (
    <>
      <div className="docs-content">
        <h1 className="docs-h1">Questions fréquentes</h1>
        <p className="docs-intro">
          Les réponses aux questions les plus posées par nos abonnés.
        </p>

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

        <DocsPager />
      </div>

      <TutoToc items={SECTIONS} />
    </>
  );
}
