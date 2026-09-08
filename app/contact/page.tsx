import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Contacter NexoraTV : support par WhatsApp, e-mail pour les demandes écrites, suppression de compte.",
};

const WHATSAPP_NUMBER = "33651446869";
const WHATSAPP_DISPLAY = "+33 6 51 44 68 69";
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
              <div className="card-icon" aria-hidden="true">
                💬
              </div>
              <h3>Support WhatsApp</h3>
              <p>
                Le moyen le plus rapide de nous joindre : commandes, activation,
                aide technique. On répond sous 24&nbsp;h ouvrées, et 7j/7 pour
                les urgences techniques.
              </p>
              <p className="muted" style={{ marginTop: 4 }}>
                {WHATSAPP_DISPLAY}
              </p>
              <a
                className="btn btn-primary"
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: 16 }}
              >
                Ouvrir WhatsApp
              </a>
            </div>

            <div className="card">
              <div className="card-icon" aria-hidden="true">
                ✉️
              </div>
              <h3>Demandes écrites &amp; questions légales</h3>
              <p>
                Facturation, réclamations, presse, questions relatives aux
                mentions légales ou à la protection des données.
              </p>
              <p className="muted" style={{ marginTop: 4 }}>
                Le support technique et les commandes se traitent sur WhatsApp,
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
              <div className="card-icon" aria-hidden="true">
                🗑️
              </div>
              <h3>Supprimer mon compte</h3>
              <p>
                Envoyez la demande depuis le numéro ou l&apos;adresse e-mail
                associés à votre compte. Le compte et les données personnelles
                associées sont supprimés sous 30&nbsp;jours.
              </p>
              <a
                className="btn btn-ghost"
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  "Bonjour, je souhaite supprimer mon compte NexoraTV.",
                )}`}
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
