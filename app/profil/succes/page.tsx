import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import SuccessRedirect from "./SuccessRedirect";

export const metadata: Metadata = { title: "Paiement réussi" };
export const dynamic = "force-dynamic";

/** Page affichée juste après un paiement, avant de basculer sur /profil. */
export default async function SuccesPage() {
  await requireUser();

  return (
    <section className="page-hero">
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="card-icon" aria-hidden="true" style={{ marginInline: "auto" }}>
          ✅
        </div>
        <span className="eyebrow">Paiement reçu</span>
        <h1>Merci pour ta commande !</h1>
        <p className="lead" style={{ marginInline: "auto" }}>
          Ton abonnement est activé automatiquement — tu recevras un e-mail
          dès qu&apos;il est prêt.
        </p>
        <SuccessRedirect to="/profil?commande=1" seconds={4} />
      </div>
    </section>
  );
}
