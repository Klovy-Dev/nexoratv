import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { listOffers, ordersForUser } from "@/lib/data";
import { goldenottConfigured } from "@/lib/goldenott";
import { formatPrice } from "@/lib/validation";
import OrderForm from "./OrderForm";
import type { Offer, ProviderKind } from "@/lib/types";

export const metadata: Metadata = {
  title: "Commander un abonnement",
  description:
    "Choisissez votre formule NexoraTV. Vos identifiants sont générés et activés après validation.",
};
export const dynamic = "force-dynamic";

const KIND_FR: Record<ProviderKind, string> = {
  line: "Ligne M3U",
  mag: "Boîtier MAG",
  code: "Code d'activation",
};

export default async function CommanderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const done = (await searchParams).commande === "1";
  const user = await getCurrentUser();
  const offers = goldenottConfigured() ? await listOffers(true) : [];
  const pendingOfferIds = new Set(
    user
      ? (await ordersForUser(user.id))
          .filter((o) => o.status === "pending" && o.offer_id != null)
          .map((o) => o.offer_id as number)
      : [],
  );

  const groups = groupByKind(offers);

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

              {groups.map(([kind, list]) => (
                <div key={kind} style={{ marginBottom: 44 }}>
                  {groups.length > 1 && (
                    <h2 style={{ fontSize: "1.4rem", marginBottom: 18 }}>
                      {KIND_FR[kind]}
                    </h2>
                  )}
                  <div className="offer-grid">
                    {list.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        canOrder={Boolean(user)}
                        alreadyPending={pendingOfferIds.has(offer.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>
    </>
  );
}

function groupByKind(offers: Offer[]): [ProviderKind, Offer[]][] {
  const map = new Map<ProviderKind, Offer[]>();
  for (const o of offers) {
    if (!map.has(o.kind)) map.set(o.kind, []);
    map.get(o.kind)!.push(o);
  }
  return [...map.entries()];
}

function OfferCard({
  offer,
  canOrder,
  alreadyPending,
}: {
  offer: Offer;
  canOrder: boolean;
  alreadyPending: boolean;
}) {
  return (
    <div className="offer-card">
      <div className="offer-card-head">
        <h3>{offer.title}</h3>
        {offer.tagline && <p className="offer-tagline">{offer.tagline}</p>}
      </div>

      <div className="offer-price">
        <strong>{formatPrice(offer.price_cents)}</strong>
        {offer.duration_label && <span>/ {offer.duration_label}</span>}
      </div>

      <ul className="offer-feats">
        <li>{KIND_FR[offer.kind]}</li>
        {offer.duration_label && <li>Durée : {offer.duration_label}</li>}
        <li>
          {offer.max_connections
            ? `${offer.max_connections} écran${offer.max_connections > 1 ? "s" : ""} simultané${offer.max_connections > 1 ? "s" : ""}`
            : "1 écran"}
        </li>
        <li>{offer.is_adult ? "Bouquets adultes inclus" : "Sans contenu adulte"}</li>
      </ul>

      {alreadyPending ? (
        <p className="flash flash-info" style={{ margin: 0 }}>
          Commande déjà en attente pour cette offre.
        </p>
      ) : canOrder ? (
        <OrderForm offerId={offer.id} kind={offer.kind} />
      ) : (
        <Link href="/connexion?next=/commander" className="btn btn-primary btn-block">
          Se connecter pour commander
        </Link>
      )}
    </div>
  );
}
