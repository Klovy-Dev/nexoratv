import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Documentation — NexoraTV" };

const CARDS = [
  {
    href: "/tuto/demarrage",
    icon: "🚀",
    title: "Créer votre compte",
    desc: "Inscrivez-vous et récupérez vos identifiants d'abonnement.",
  },
  {
    href: "/tuto/applications",
    icon: "📲",
    title: "Choisir son application",
    desc: "L'application recommandée selon votre appareil.",
  },
  {
    href: "/tuto/appareils",
    icon: "📺",
    title: "Appareils compatibles",
    desc: "Téléviseurs, box et Fire Stick pris en charge.",
  },
  {
    href: "/tuto/connexion",
    icon: "🔑",
    title: "Se connecter",
    desc: "Ajoutez votre playlist et lancez votre premier direct.",
  },
  {
    href: "/tuto/faq",
    icon: "💬",
    title: "Questions fréquentes",
    desc: "Les réponses aux questions les plus posées.",
  },
];

export default function TutoHome() {
  return (
    <div className="docs-content docs-home">
      <span className="docs-kicker">Documentation</span>
      <h1 className="docs-h1">Guide d&apos;installation NexoraTV</h1>
      <p className="docs-intro">
        Tout ce qu&apos;il faut savoir pour installer et utiliser NexoraTV sur
        votre téléphone, votre téléviseur ou votre box. Choisissez une
        catégorie pour commencer.
      </p>

      <div className="docs-cards">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="docs-card">
            <span className="docs-card-icon">{c.icon}</span>
            <span className="docs-card-title">{c.title}</span>
            <span className="docs-card-desc">{c.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
