import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ordersForUser, listOffers, subscriptionsForUser } from "@/lib/data";
import { goldenottConfigured } from "@/lib/goldenott";
import { formatDate, formatPrice, initials } from "@/lib/validation";
import CopyButton from "@/components/CopyButton";
import SecretValue from "@/components/SecretValue";
import NameForm from "./NameForm";
import PasswordForm from "./PasswordForm";
import RenewButton, { type RenewOffer } from "./RenewButton";
import { cancelOrderAction } from "@/actions/order-actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import type { Order, ProviderKind } from "@/lib/types";

export const metadata: Metadata = { title: "Mon profil" };
export const dynamic = "force-dynamic";

const KIND_CRED_LABEL: Record<ProviderKind, string> = {
  line: "Utilisateur",
  mag: "Adresse MAC",
  code: "Code d'activation",
};

const ORDER_STATUS: Record<string, [string, string]> = {
  pending: ["badge-suspended", "En attente de validation"],
  fulfilled: ["badge-active", "Activée"],
  rejected: ["badge-expired", "Refusée"],
  cancelled: ["badge", "Annulée"],
};

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const bienvenue = params.bienvenue;
  const commande = params.commande === "1";

  const [subs, orders, offers] = await Promise.all([
    subscriptionsForUser(user.id),
    ordersForUser(user.id),
    goldenottConfigured() ? listOffers(true) : Promise.resolve([]),
  ]);

  const pendingRenewSubIds = new Set(
    orders
      .filter((o) => o.status === "pending" && o.renew_sub_id != null)
      .map((o) => o.renew_sub_id as number),
  );
  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "rejected",
  );

  const renewOffersByKind = (kind: ProviderKind): RenewOffer[] =>
    offers
      .filter((o) => o.kind === kind)
      .map((o) => ({
        id: o.id,
        title: o.title,
        price_cents: o.price_cents,
        duration_label: o.duration_label,
      }));

  return (
    <section style={{ paddingTop: 60 }}>
      <div className="container" style={{ maxWidth: 900 }}>
        {bienvenue && (
          <div className="flash flash-success" style={{ marginBottom: 20 }}>
            Bienvenue sur NexoraTV, votre compte a été créé.
          </div>
        )}
        {commande && (
          <div className="flash flash-success" style={{ marginBottom: 20 }}>
            Votre commande a bien été enregistrée. Vous serez notifié dès son
            activation.
          </div>
        )}

        <div className="profile-head reveal">
          <div className="profile-avatar">{initials(user.name)}</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1>{user.name}</h1>
            <div className="meta">
              {user.email} · membre depuis {formatDate(user.created_at)}
            </div>
            <div style={{ marginTop: 8 }}>
              <span className={`badge ${user.role === "admin" ? "badge-admin" : ""}`}>
                {user.role === "admin" ? "Administrateur" : "Client"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {user.role === "admin" && (
              <Link href="/admin" className="btn btn-ghost">
                Espace admin
              </Link>
            )}
            <Link href="/commander" className="btn btn-primary">
              Commander
            </Link>
          </div>
        </div>

        {activeOrders.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.4rem", margin: "36px 0 18px" }}>
              Mes commandes
            </h2>
            <div className="stack">
              {activeOrders.map((o: Order) => {
                const [cls, label] = ORDER_STATUS[o.status] ?? ["badge", o.status];
                return (
                  <div className="sub-card" key={o.id} style={{ padding: 20 }}>
                    <div className="sub-card-head" style={{ marginBottom: 8 }}>
                      <div>
                        <h3 style={{ fontSize: "1rem" }}>{o.title}</h3>
                        <div className="muted" style={{ fontSize: "0.82rem" }}>
                          {formatPrice(o.price_cents)} · commandé le{" "}
                          {formatDate(o.created_at)}
                        </div>
                      </div>
                      <span className={`badge ${cls}`}>{label}</span>
                    </div>
                    {o.admin_note && o.status === "rejected" && (
                      <p className="muted" style={{ fontSize: "0.88rem" }}>
                        Motif : {o.admin_note}
                      </p>
                    )}
                    {o.status === "pending" && (
                      <form action={cancelOrderAction} className="inline-form">
                        <input type="hidden" name="order_id" value={o.id} />
                        <ConfirmSubmit
                          className="btn btn-ghost btn-sm"
                          confirm="Annuler cette commande ?"
                        >
                          Annuler
                        </ConfirmSubmit>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <h2 style={{ fontSize: "1.4rem", margin: "36px 0 18px" }}>
          Mes identifiants d&apos;abonnement
        </h2>

        {subs.length === 0 ? (
          <div className="empty-state">
            <p>Aucun abonnement n&apos;est encore associé à votre compte.</p>
            <p style={{ marginTop: 8 }}>
              <Link href="/commander" style={{ color: "var(--text)" }}>
                Commandez une formule
              </Link>{" "}
              ou{" "}
              <Link href="/contact" style={{ color: "var(--text)" }}>
                contactez le support
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            {subs.map((sub) => {
              const [cls, text] =
                sub.status === "suspended"
                  ? ["badge-suspended", "Suspendu"]
                  : sub.expired
                    ? ["badge-expired", "Expiré"]
                    : ["badge-active", "Actif"];
              const kind = sub.provider_kind ?? "line";
              const credValue = kind === "mag" ? sub.mac ?? "" : sub.username;

              return (
                <div className="sub-card reveal" key={sub.id}>
                  <div className="sub-card-head">
                    <div>
                      <h3>{sub.label}</h3>
                      <div className="muted" style={{ fontSize: "0.85rem" }}>
                        Expire le {formatDate(sub.expires_at)}
                      </div>
                    </div>
                    <span className={`badge ${cls}`}>{text}</span>
                  </div>

                  <div className="cred-list">
                    {sub.server_url && (
                      <div className="cred-row">
                        <span className="k">Serveur / URL</span>
                        <span className="v">{sub.server_url}</span>
                        <CopyButton value={sub.server_url} />
                      </div>
                    )}
                    <div className="cred-row">
                      <span className="k">{KIND_CRED_LABEL[kind]}</span>
                      <span className="v">{credValue || "—"}</span>
                      {credValue && <CopyButton value={credValue} />}
                    </div>
                    {kind === "line" && (
                      <div className="cred-row">
                        <span className="k">Mot de passe</span>
                        <SecretValue value={sub.password} />
                      </div>
                    )}
                    {sub.screens && (
                      <div className="cred-row">
                        <span className="k">Écrans simultanés</span>
                        <span className="v" style={{ fontFamily: "inherit" }}>
                          {sub.screens}
                        </span>
                        <span />
                      </div>
                    )}
                    {sub.qr_url && (
                      <div className="cred-row">
                        <span className="k">Bouquets</span>
                        <span className="v" style={{ fontFamily: "inherit" }}>
                          <a
                            href={sub.qr_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "var(--blue)" }}
                          >
                            Personnaliser mes chaînes
                          </a>
                        </span>
                        <span />
                      </div>
                    )}
                    {sub.note && (
                      <div className="cred-row">
                        <span className="k">Note</span>
                        <span className="v" style={{ fontFamily: "inherit" }}>
                          {sub.note}
                        </span>
                        <span />
                      </div>
                    )}
                  </div>

                  {sub.provider === "goldenott" && (
                    <RenewButton
                      subId={sub.id}
                      offers={renewOffersByKind(kind)}
                      pending={pendingRenewSubIds.has(sub.id)}
                    />
                  )}
                </div>
              );
            })}
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              Ces informations sont strictement personnelles. Ne les communiquez à
              personne.
            </p>
          </>
        )}

        <h2 style={{ fontSize: "1.4rem", margin: "44px 0 18px" }}>
          Paramètres du compte
        </h2>

        <div className="grid-2">
          <NameForm currentName={user.name} email={user.email} />
          <PasswordForm />
        </div>
      </div>
    </section>
  );
}
