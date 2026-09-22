import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { hasUsedTrial, listOffers, ordersForUser } from "@/lib/data";
import { goldenottConfigured } from "@/lib/goldenott";
import { loadGoldenottCatalog, trialPackageIds } from "@/lib/goldenott-catalog";
import { ORDERS_DISABLED, ORDERS_DISABLED_MESSAGE } from "@/lib/orders-maintenance";
import CommanderTabs from "./CommanderTabs";
import type { OfferCardData } from "./offer-groups";

export const metadata: Metadata = {
  title: "Commander un abonnement",
  description:
    "Choisissez votre formule NexoraTV. Vos identifiants sont générés et activés après validation.",
};
export const dynamic = "force-dynamic";

export default async function CommanderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const done = (await searchParams).commande === "1";

  if (ORDERS_DISABLED) {
    return (
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Abonnements</span>
          <h1>Commandes temporairement suspendues</h1>
          <p className="lead" style={{ marginInline: "auto" }}>
            {ORDERS_DISABLED_MESSAGE}
          </p>
          <p style={{ marginTop: 20 }}>
            <Link href="/contact" className="btn btn-primary">
              Nous contacter
            </Link>
          </p>
        </div>
      </section>
    );
  }

  const user = await getCurrentUser();
  const configured = goldenottConfigured();
  const offers = configured ? await listOffers(true) : [];
  const catalog = configured
    ? await loadGoldenottCatalog()
    : null;
  const trialIds = catalog ? new Set(trialPackageIds(catalog)) : new Set<number>();

  const pendingOfferIds = new Set(
    user
      ? (await ordersForUser(user.id))
          .filter((o) => o.status === "pending" && o.offer_id != null)
          .map((o) => o.offer_id as number)
      : [],
  );

  // L'essai n'est proposé qu'une fois par compte.
  const trialUsed =
    user && catalog
      ? await hasUsedTrial(user.id, trialPackageIds(catalog))
      : false;

  const cardData: OfferCardData[] = offers.map((offer) => ({
    offer,
    alreadyPending: pendingOfferIds.has(offer.id),
    trialLocked: trialUsed && trialIds.has(offer.goldenott_package_id),
  }));
  // "Formules normales" = 1 écran (y compris essai/mag/code) ; "Autres" =
  // les packs multi-écrans (Duo/Trio/Famille, included_screens > 1).
  const normalCards = cardData.filter((c) => c.offer.included_screens <= 1);
  const packCards = cardData.filter((c) => c.offer.included_screens > 1);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Abonnements</span>
          <h1>Choisissez votre formule</h1>
          <p className="lead" style={{ marginInline: "auto" }}>
            Après validation de votre commande, vos identifiants sont générés
            automatiquement et apparaissent dans votre espace client.
          </p>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="container">
          {done && (
            <div className="flash flash-success" style={{ marginBottom: 28 }}>
              Commande enregistrée ! Notre équipe la valide au plus vite —
              suivez son statut dans{" "}
              <Link href="/profil" style={{ color: "var(--text)" }}>
                votre profil
              </Link>
              .
            </div>
          )}

          {offers.length === 0 ? (
            <div className="empty-state">
              <p>Aucune offre n&apos;est disponible pour le moment.</p>
              <p style={{ marginTop: 8 }}>
                <Link href="/contact" style={{ color: "var(--text)" }}>
                  Contactez-nous
                </Link>{" "}
                pour un abonnement sur mesure.
              </p>
            </div>
          ) : (
            <>
              {!user && (
                <div className="flash flash-info" style={{ marginBottom: 28 }}>
                  <Link href="/connexion?next=/commander" style={{ color: "var(--text)", fontWeight: 600 }}>
                    Connectez-vous
                  </Link>{" "}
                  ou{" "}
                  <Link href="/inscription" style={{ color: "var(--text)", fontWeight: 600 }}>
                    créez un compte
                  </Link>{" "}
                  pour passer commande.
                </div>
              )}

              <CommanderTabs normalCards={normalCards} packCards={packCards} loggedIn={Boolean(user)} />
            </>
          )}
        </div>
      </section>
    </>
  );
}

