import type { Metadata } from "next";
import Link from "next/link";
import { DISCORD_INVITE_URL } from "@/lib/community-links";
import { GameControllerIcon, ChatIcon, MailIcon, TrashIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Contacter NexoraTV : support par Telegram, e-mail pour les demandes écrites, suppression de compte.",
};

const TELEGRAM_URL = "https://t.me/+sY5fAIgqlLkzYjQ0";
const SUPPORT_EMAIL = "contact@nexoratv.fr";

export default function ContactPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Support</span>
          <h1>
            Une question, un problème,{" "}
            <span className="gradient-text">une idée&nbsp;?</span>
          </h1>
          <p className="lead" style={{ marginInline: "auto" }}>
            L&apos;équipe NexoraTV est joignable directement. Choisissez le canal
            adapté à votre demande.
          </p>
        </div>
      </section>

      <section style={{ paddingTop: 30, paddingBottom: 20 }}>
        <div className="container">
          <div className="grid">
            <div className="card">
              <div className="card-icon">
                <GameControllerIcon />
              </div>
              <h3>Communauté Discord</h3>
              <p>
                Posez vos questions aux autres utilisateurs et à l&apos;équipe,
                suivez les annonces de mises à jour et proposez vos idées. FAQ et
                salons d&apos;entraide sur place.
              </p>
              <a
                className="btn btn-primary"
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: 16 }}
              >
                Rejoindre le Discord
              </a>
            </div>

            <div className="card">
              <div className="card-icon">
                <ChatIcon />
              </div>
              <h3>Support Telegram</h3>
              <p>
                Le moyen le plus rapide de nous joindre : commandes, activation,
                aide technique. On répond sous 24&nbsp;h ouvrées, et 7j/7 pour
                les urgences techniques.
              </p>
              <a
                className="btn btn-primary"
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: 16 }}
              >
                Ouvrir Telegram
              </a>
            </div>

            <div className="card">
              <div className="card-icon">
                <MailIcon />
              </div>
              <h3>Demandes écrites &amp; questions légales</h3>
              <p>
                Facturation, réclamations, presse, questions relatives aux
                mentions légales ou à la protection des données.
              </p>
              <p className="muted" style={{ marginTop: 4 }}>
                Le support technique et les commandes se traitent sur Telegram,
                pas par e-mail.
              </p>
              <a
                className="btn btn-ghost"
                href={`mailto:${SUPPORT_EMAIL}`}
                style={{ marginTop: 16 }}
              >
                {SUPPORT_EMAIL}
              </a>
            </div>

            <div className="card">
              <div className="card-icon">
                <TrashIcon />
              </div>
              <h3>Supprimer mon compte</h3>
              <p>
                Envoyez la demande depuis le compte Telegram ou l&apos;adresse
                e-mail associés à votre compte. Le compte et les données
                personnelles associées sont supprimés sous 30&nbsp;jours.
              </p>
              <a
                className="btn btn-ghost"
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: 16 }}
              >
                Demander la suppression
              </a>
            </div>
          </div>

          <p className="muted" style={{ marginTop: 32, textAlign: "center" }}>
            Voir aussi la{" "}
            <Link href="/confidentialite">politique de confidentialité</Link>, les{" "}
            <Link href="/conditions">conditions d&apos;utilisation</Link> et les{" "}
            <Link href="/mentions-legales">mentions légales</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
