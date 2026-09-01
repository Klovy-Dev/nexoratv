import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { offerById, ordersForUser } from "@/lib/data";
import { goldenottConfigured } from "@/lib/goldenott";
import { formatPrice } from "@/lib/validation";
import OrderPageForm from "./OrderPageForm";
import type { ProviderKind } from "@/lib/types";

export const dynamic = "force-dynamic";

const KIND_FR: Record<ProviderKind, string> = {
  line: "Ligne M3U",
  mag: "Boîtier MAG",
  code: "Code d'activation",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const offer = await offerById(Number((await params).id));
  return { title: offer ? `Commander — ${offer.title}` : "Commander" };
}

export default async function OrderStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  const dest = `/commander/${id}`;

  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${dest}`);

  if (!goldenottConfigured()) redirect("/commander");
  const offer = await offerById(id);
  if (!offer || !offer.active) redirect("/commander");

  const pending = (await ordersForUser(user.id)).some(
    (o) => o.status === "pending" && o.offer_id === offer.id,
  );

  return (
    <section className="order-step">
      <div className="container" style={{ maxWidth: 940 }}>
        <Link href="/commander" className="order-back">
          ← Toutes les offres
        </Link>

        <ol className="order-steps" aria-label="Étapes de la commande">
          <li className="done">Choix de la formule</li>
          <li className="current">Votre commande</li>
          <li>Activation par l&apos;équipe</li>
        </ol>

        <div className="order-layout">
          <div className="order-main">
            <header className="order-head">
              {offer.badge && <span className="offer-ribbon-static">{offer.badge}</span>}
              <h1>{offer.title}</h1>
              {offer.tagline && <p className="lead">{offer.tagline}</p>}
            </header>

            {pending ? (
              <div className="empty-state" style={{ textAlign: "left" }}>
                <p>Vous avez déjà une commande en attente pour cette offre.</p>
                <p style={{ marginTop: 10 }}>
                  <Link href="/profil" style={{ color: "var(--text)" }}>
                    Suivre ma commande →
                  </Link>
                </p>
              </div>
            ) : (
              <OrderPageForm
                offer={{
                  id: offer.id,
                  kind: offer.kind,
                  price_cents: offer.price_cents,
                  included_screens: offer.included_screens,
                  allow_screens: offer.allow_screens,
                  extra_screen_cents: offer.extra_screen_cents,
                  max_screens: offer.max_screens,
                }}
              />
            )}

            <ul className="order-reassure">
              <li>
                <span aria-hidden="true">💳</span> Aucun paiement immédiat
              </li>
              <li>
                <span aria-hidden="true">⚡</span> Activation rapide après validation
              </li>
              <li>
                <span aria-hidden="true">💬</span> Support si besoin d&apos;aide
              </li>
            </ul>
          </div>

          <aside className="order-recap">
            <span className="order-recap-kicker">Récapitulatif</span>
            <div className="order-recap-price">
              {offer.allow_screens && <small>à partir de</small>}
              <strong>{formatPrice(offer.price_cents)}</strong>
              {offer.duration_label && <em>/ {offer.duration_label}</em>}
            </div>
            <dl>
              <div>
                <dt>Formule</dt>
                <dd>{KIND_FR[offer.kind]}</dd>
              </div>
              {offer.duration_label && (
                <div>
                  <dt>Durée</dt>
                  <dd>{offer.duration_label}</dd>
                </div>
              )}
              <div>
                <dt>Écrans inclus</dt>
                <dd>{offer.included_screens}</dd>
              </div>
              {offer.allow_screens && (
                <div>
                  <dt>Écran en plus</dt>
                  <dd>+{formatPrice(offer.extra_screen_cents)}</dd>
                </div>
              )}
              <div>
                <dt>Contenu adulte</dt>
                <dd>{offer.is_adult ? "Inclus" : "Non inclus"}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </section>
  );
}
