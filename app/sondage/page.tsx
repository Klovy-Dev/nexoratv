import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import FeedbackForm from "./FeedbackForm";

export const metadata: Metadata = {
  title: "Votre avis compte",
  description:
    "Dites-nous ce que vous pensez de NexoraTV et ce que vous aimeriez voir ajouté.",
};
export const dynamic = "force-dynamic";

/**
 * Page volontairement hors navigation (pas d'onglet, pas de lien dans le
 * header) : accessible uniquement via son URL directe, partagée à la main
 * (Discord, Telegram, e-mail...). Ne nécessite pas de compte.
 */
export default async function SondagePage() {
  const user = await getCurrentUser();

  return (
    <section className="page-hero" style={{ paddingBottom: 60 }}>
      <div className="container" style={{ maxWidth: 640 }}>
        <span className="eyebrow">Votre avis compte</span>
        <h1>
          Aidez-nous à <span className="gradient-text">améliorer NexoraTV</span>
        </h1>
        <p className="lead" style={{ marginInline: "auto" }}>
          Deux minutes suffisent. Dites-nous ce que vous aimez, ce qui vous
          agace, et ce que vous aimeriez voir ajouté — anonymement si vous
          préférez.
        </p>

        <div style={{ textAlign: "left", marginTop: 32 }}>
          <FeedbackForm
            defaultName={user?.name ?? ""}
            defaultEmail={user?.email ?? ""}
          />
        </div>
      </div>
    </section>
  );
}
