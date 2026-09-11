import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ordersForUser, purgeExpiredTrialsAndRejected, subscriptionsForUser } from "@/lib/data";
import {
  daysUntil,
  expiryLabel,
  formatDate,
  formatPrice,
  initials,
} from "@/lib/validation";
import CopyButton from "@/components/CopyButton";
import SecretValue from "@/components/SecretValue";
import NameForm from "./NameForm";
import PasswordForm from "./PasswordForm";
import ProfilTabs, { type ProfilTab } from "./ProfilTabs";
import { cancelOrderAction, resumeOrderPaymentAction } from "@/actions/order-actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import SubmitButton from "@/components/SubmitButton";
import type { Order, ProviderKind } from "@/lib/types";

export const metadata: Metadata = { title: "Mon profil" };
export const dynamic = "force-dynamic";

const KIND_CRED_LABEL: Record<ProviderKind, string> = {
  line: "Utilisateur",
  mag: "Adresse MAC",
  code: "Code d'activation",
};

const ORDER_STATUS: Record<string, { cls: string; label: string; dot: string }> = {
  awaiting_payment: { cls: "badge-suspended", label: "En attente de paiement", dot: "warning" },
  pending: { cls: "badge-suspended", label: "Payée — activation en cours", dot: "warning" },
  fulfilled: { cls: "badge-active", label: "Activée", dot: "success" },
  rejected: { cls: "badge-expired", label: "Refusée", dot: "danger" },
  cancelled: { cls: "badge", label: "Annulée", dot: "muted" },
};

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  await purgeExpiredTrialsAndRejected();
  const params = await searchParams;
  const bienvenue = params.bienvenue;
  const commande = params.commande === "1";
  const tabParam = typeof params.onglet === "string" ? params.onglet : undefined;

  const [subs, orders] = await Promise.all([
    subscriptionsForUser(user.id),
    ordersForUser(user.id),
  ]);

  const visibleOrders = orders.filter(
    (o) =>
      o.status === "pending" ||
      o.status === "awaiting_payment" ||
      o.status === "rejected",
  );
  const pendingCount = orders.filter(
    (o) => o.status === "pending" || o.status === "awaiting_payment",
  ).length;

  /* ---------- Contenu des onglets ---------- */

  const subsPanel = (
    <>
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
            const left = daysUntil(sub.expires_at);
            const soon = left !== null && left >= 0 && left <= 7;

            return (
              <div className="sub-card reveal" key={sub.id}>
                <div className="sub-card-head">
                  <div>
                    <h3>{sub.label}</h3>
                    <div
                      className="muted"
                      style={{ fontSize: "0.85rem", marginTop: 2 }}
                    >
                      {sub.expires_at ? (
                        <>
                          Échéance {formatDate(sub.expires_at)}
                          {expiryLabel(sub.expires_at) && (
                            <span
                              className={`expiry-chip${soon ? " soon" : ""}${sub.expired ? " over" : ""}`}
                            >
                              {expiryLabel(sub.expires_at)}
                            </span>
                          )}
                        </>
                      ) : (
                        "Sans date d'expiration"
                      )}
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
              </div>
            );
          })}
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Ces informations sont strictement personnelles. Ne les communiquez à
            personne.
          </p>
        </>
      )}
    </>
  );

  const ordersPanel =
    visibleOrders.length > 0 ? (
      <div className="order-track">
        {visibleOrders.map((o: Order) => {
          const s = ORDER_STATUS[o.status] ?? ORDER_STATUS.cancelled;
          return (
            <div className={`order-track-card dot-${s.dot}`} key={o.id}>
              <div className="order-track-main">
                <strong>{o.title}</strong>
                <span className="muted">
                  {formatPrice(o.price_cents)} · commandé le{" "}
                  {formatDate(o.created_at)}
                </span>
                {o.status === "pending" && (
                  <span className="order-track-reason">
                    Paiement confirmé — notre équipe finalise l&apos;activation,
                    vous recevrez un e-mail dès qu&apos;elle est prête.
                  </span>
                )}
                {o.status === "rejected" && o.admin_note && (
                  <span className="order-track-reason">
                    Motif : {o.admin_note}
                  </span>
                )}
              </div>
              <div className="order-track-side">
                <span className={`badge ${s.cls}`}>{s.label}</span>
                {o.status === "awaiting_payment" && (
                  <form action={resumeOrderPaymentAction} className="inline-form">
                    <input type="hidden" name="order_id" value={o.id} />
                    <SubmitButton
                      className="btn btn-primary btn-sm"
                      pendingLabel="Redirection…"
                    >
                      Payer maintenant
                    </SubmitButton>
                  </form>
                )}
                {o.status === "awaiting_payment" && (
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
            </div>
          );
        })}
      </div>
    ) : (
      <div className="empty-state">
        <p>Aucune commande en cours.</p>
        <p style={{ marginTop: 8 }}>
          <Link href="/commander" style={{ color: "var(--text)" }}>
            Voir les offres
          </Link>
        </p>
      </div>
    );

  const accountPanel = (
    <>
      <div className="grid-2">
        <NameForm currentName={user.name} email={user.email} />
        <PasswordForm />
      </div>
    </>
  );

  const tabs: ProfilTab[] = [
    { id: "abonnements", label: "Mes abonnements", content: subsPanel },
    {
      id: "commandes",
      label: "Mes commandes",
      badge: pendingCount || undefined,
      content: ordersPanel,
    },
    { id: "compte", label: "Paramètres du compte", content: accountPanel },
  ];

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
            Paiement reçu, merci ! Votre abonnement est activé automatiquement
            — vous recevrez un e-mail dès qu&apos;il est prêt.
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

        <ProfilTabs
          tabs={tabs}
          initial={commande ? "commandes" : tabParam}
        />
      </div>
    </section>
  );
}
