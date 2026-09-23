import Link from "next/link";
import { formatPrice } from "@/lib/validation";
import type { Offer, ProviderKind } from "@/lib/types";
import { CheckIcon, LockIcon, MonitorIcon, UsersIcon } from "@/components/icons";

export const KIND_FR: Record<ProviderKind, string> = {
  line: "Ligne M3U",
  mag: "Boîtier MAG",
  code: "Code d'activation",
};

/** Nombre de mois porté par le libellé de durée (« 12 mois », « 2 ans »…), sinon null. */
function durationMonths(label: string): number | null {
  const months = /(\d+)\s*mois/i.exec(label);
  if (months) return Number(months[1]);
  const years = /(\d+)\s*ans?\b/i.exec(label);
  if (years) return Number(years[1]) * 12;
  return null;
}

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
  const featured = Boolean(offer.badge);
  const months = offer.duration_label ? durationMonths(offer.duration_label) : null;
  const perMonth = months && months > 1 ? offer.price_cents / months : null;
  const screens = offer.included_screens;

  return (
    <article
      className={`plan-card${featured ? " plan-card--featured" : ""}${
        trialLocked ? " plan-card--locked" : ""
      }`}
    >
      {featured && <span className="plan-ribbon">{offer.badge}</span>}

      <header className="plan-head">
        <div className="plan-meta">
          <span>{KIND_FR[offer.kind]}</span>
          {offer.duration_label && <span className="plan-duration">{offer.duration_label}</span>}
        </div>
        <h3>{offer.title}</h3>
        {offer.tagline && <p className="plan-tagline">{offer.tagline}</p>}
      </header>

      <div className="plan-price">
        {offer.allow_screens && <span className="plan-from">À partir de</span>}
        <div className="plan-amount">
          <strong>{offer.price_cents === 0 ? "Gratuit" : formatPrice(offer.price_cents)}</strong>
          {offer.compare_at_cents != null && offer.compare_at_cents > offer.price_cents && (
            <del>{formatPrice(offer.compare_at_cents)}</del>
          )}
        </div>
        {offer.duration_label && (
          <span className="plan-period">
            pour {offer.duration_label}
            {perMonth != null && offer.price_cents > 0 && (
              <>
                {" "}· soit <b>{formatPrice(Math.round(perMonth))}/mois</b>
              </>
            )}
          </span>
        )}
      </div>

      <ul className="plan-feats">
        <li>
          <MonitorIcon size={18} />
          <span>
            <strong>
              {screens} écran{screens > 1 ? "s" : ""}
            </strong>{" "}
            inclus
          </span>
        </li>
        {offer.allow_screens && (
          <li>
            <UsersIcon size={18} />
            <span>
              Jusqu&apos;à {offer.max_screens} écrans, dès +
              {formatPrice(offer.extra_screen_cents)} par écran
            </span>
          </li>
        )}
        <li>
          <LockIcon size={18} />
          <span>
            {offer.is_adult
              ? "Chaînes adultes incluses, désactivables à la commande"
              : "Sans chaînes adultes"}
          </span>
        </li>
        <li>
          <CheckIcon size={18} />
          <span>Identifiants dans votre espace client après validation</span>
        </li>
      </ul>

      <div className="plan-cta">
        {trialLocked ? (
          <p className="flash flash-info">
            Essai déjà utilisé — une seule fois par compte.
          </p>
        ) : alreadyPending ? (
          <p className="flash flash-info">
            Commande déjà en attente — suivez-la dans{" "}
            <Link href="/profil" style={{ color: "var(--text)" }}>
              votre profil
            </Link>
            .
          </p>
        ) : (
          <Link
            href={orderHref}
            className={`btn btn-block ${featured ? "btn-primary" : "btn-ghost"}`}
          >
            Commander
          </Link>
        )}
      </div>
    </article>
  );
}
