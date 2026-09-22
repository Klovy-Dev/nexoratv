import Link from "next/link";
import { formatPrice } from "@/lib/validation";
import type { Offer, ProviderKind } from "@/lib/types";

export const KIND_FR: Record<ProviderKind, string> = {
  line: "Ligne M3U",
  mag: "Boîtier MAG",
  code: "Code d'activation",
};

export default function OfferCard({
  offer,
  loggedIn,
  alreadyPending,
  trialLocked,
}: {
  offer: Offer;
  loggedIn: boolean;
  alreadyPending: boolean;
  trialLocked: boolean;
}) {
  const orderHref = loggedIn
    ? `/commander/${offer.id}`
    : `/connexion?next=/commander/${offer.id}`;

  return (
    <div
      className={`offer-card${offer.badge ? " offer-card--featured" : ""}${
        trialLocked ? " offer-card--locked" : ""
      }`}
    >
      {offer.badge && <span className="offer-ribbon">{offer.badge}</span>}
      <div className="offer-card-head">
        <h3>{offer.title}</h3>
        {offer.tagline && <p className="offer-tagline">{offer.tagline}</p>}
      </div>

      <div className="offer-price">
        {offer.allow_screens && <span className="offer-from">à partir de</span>}
        <strong>{formatPrice(offer.price_cents)}</strong>
        {offer.duration_label && <span>/ {offer.duration_label}</span>}
      </div>

      <ul className="offer-feats">
        <li>{KIND_FR[offer.kind]}</li>
        {offer.duration_label && <li>Durée : {offer.duration_label}</li>}
        <li>
          {offer.included_screens} écran{offer.included_screens > 1 ? "s" : ""} inclus
          {offer.allow_screens
            ? ` · jusqu'à ${offer.max_screens} (à partir de +${formatPrice(offer.extra_screen_cents)}/écran)`
            : ""}
        </li>
        <li>
          {offer.is_adult
            ? "Chaîne adulte incluse (désactivable à la commande)"
            : "Sans chaîne adulte"}
        </li>
      </ul>

      <div className="offer-cta">
        {trialLocked ? (
          <p className="flash flash-info" style={{ margin: 0 }}>
            Essai déjà utilisé — une seule fois par compte. Découvrez nos
            formules complètes ci-dessus.
          </p>
        ) : alreadyPending ? (
          <p className="flash flash-info" style={{ margin: 0 }}>
            Commande déjà en attente — suivez-la dans{" "}
            <Link href="/profil" style={{ color: "var(--text)" }}>
              votre profil
            </Link>
            .
          </p>
        ) : (
          <Link href={orderHref} className="btn btn-primary btn-block">
            Commander
          </Link>
        )}
      </div>
    </div>
  );
}
