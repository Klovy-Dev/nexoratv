import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { allOrders, purgeExpiredTrialsAndRejected } from "@/lib/data";
import { loadGoldenottCatalog } from "@/lib/goldenott-catalog";
import { formatDate, formatPrice } from "@/lib/validation";
import TableSearch from "@/components/TableSearch";
import OrderDecision from "./OrderDecision";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { confirmBitcoinPaymentAction } from "@/actions/order-actions";
import { mempoolAddressUrl, mempoolTxUrl, satsToBtc, sweepBitcoinOrders } from "@/lib/bitcoin";
import type { OrderView, ProviderKind } from "@/lib/types";

export const metadata: Metadata = { title: "Commandes — Administration" };
export const dynamic = "force-dynamic";

const KIND_FR: Record<ProviderKind, string> = {
  line: "Ligne M3U",
  mag: "Boîtier MAG",
  code: "Code d'activation",
};

const PROVIDER_FR: Record<string, string> = {
  stripe: "Stripe",
  paypal: "PayPal",
  bitcoin: "Bitcoin",
};

const STATUS_FR: Record<string, [string, string]> = {
  pending: ["badge-suspended", "Payée — à activer"],
  fulfilled: ["badge-active", "Provisionnée"],
  rejected: ["badge-expired", "Refusée"],
  cancelled: ["badge", "Annulée"],
};

export default async function OrdersAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  await sweepBitcoinOrders();
  await purgeExpiredTrialsAndRejected();
  const ok = (await searchParams).ok === "1";

  const [allOrdersList, catalog] = await Promise.all([
    allOrders(),
    loadGoldenottCatalog(),
  ]);

  // Les commandes 'awaiting_payment' (session Stripe ouverte, pas encore
  // payée) ne nécessitent aucune action admin : purgées après 2 h si
  // abandonnées, sinon elles deviennent 'pending' (payées) automatiquement.
  // Exception : les commandes Bitcoin, qui peuvent demander une confirmation
  // manuelle (montant envoyé différent du montant exact demandé).
  const btcAwaiting = allOrdersList.filter(
    (o) => o.status === "awaiting_payment" && o.payment_provider === "bitcoin",
  );
  const orders = allOrdersList.filter((o) => o.status !== "awaiting_payment");
  const pending = orders.filter((o) => o.status === "pending");
  const done = orders.filter((o) => o.status !== "pending");

  return (
    <section>
      <div className="container">
        {ok && (
          <div className="flash flash-success" style={{ marginBottom: 20 }}>
            Commande traitée.
          </div>
        )}
        {catalog.configured && catalog.error && (
          <div className="flash flash-error" style={{ marginBottom: 20 }}>
            GoldenOTT injoignable ({catalog.error}) — le provisioning échouera
            tant que la connexion n&apos;est pas rétablie.
          </div>
        )}
        {catalog.configured && !catalog.error && catalog.credit != null && (
          <p className="form-note" style={{ marginBottom: 20 }}>
            Crédit revendeur : <strong>{catalog.credit.toFixed(2)}</strong>
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <a href="/api/admin/export/commandes" className="btn btn-ghost btn-sm">
            ⬇ Exporter CSV
          </a>
        </div>

        <div className="panel">
          <h2>À traiter ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="muted">Aucune commande en attente.</p>
          ) : (
            <div className="sub-admin-list">
              {pending.map((o) => (
                <OrderCard key={o.id} order={o} actionable />
              ))}
            </div>
          )}
        </div>

        {btcAwaiting.length > 0 && (
          <div className="panel">
            <h2>Paiements Bitcoin en attente ({btcAwaiting.length})</h2>
            <p className="muted" style={{ marginBottom: 12 }}>
              Détectés et activés automatiquement dès 1 confirmation. Confirmez
              à la main uniquement un paiement vérifié sur{" "}
              <a href={mempoolAddressUrl()} target="_blank" rel="noreferrer">
                mempool.space
              </a>{" "}
              mais non reconnu (montant différent). Non payées, elles sont
              supprimées après 24 h.
            </p>
            <div className="sub-admin-list">
              {btcAwaiting.map((o) => (
                <div className="sub-admin-card" key={o.id}>
                  <div className="sub-admin-top">
                    <div>
                      <strong>{o.title}</strong>
                      <div className="muted" style={{ fontSize: "0.82rem" }}>
                        {o.user_name} · {o.user_email} · commandé le{" "}
                        {formatDate(o.created_at)}
                      </div>
                    </div>
                    <span className="badge badge-suspended">
                      {o.btc_txid ? "Tx vue — non confirmée" : "En attente"}
                    </span>
                  </div>
                  <div className="sub-admin-grid">
                    <div className="sub-admin-field">
                      <span className="k">Montant attendu</span>
                      <span className="v">
                        {o.btc_amount_sats ? `${satsToBtc(Number(o.btc_amount_sats))} BTC` : "—"} ·{" "}
                        {formatPrice(o.price_cents - o.credit_applied_cents)}
                      </span>
                    </div>
                    {o.btc_txid && (
                      <div className="sub-admin-field">
                        <span className="k">Transaction</span>
                        <span className="v">
                          <a href={mempoolTxUrl(o.btc_txid)} target="_blank" rel="noreferrer">
                            {o.btc_txid.slice(0, 16)}…
                          </a>
                        </span>
                      </div>
                    )}
                  </div>
                  <form action={confirmBitcoinPaymentAction} className="inline-form" style={{ gap: 8, marginTop: 12 }}>
                    <input type="hidden" name="order_id" value={o.id} />
                    {!o.btc_txid && (
                      <input
                        name="txid"
                        className="input"
                        placeholder="txid (facultatif)"
                        autoComplete="off"
                        style={{ maxWidth: 320 }}
                      />
                    )}
                    <ConfirmSubmit
                      className="btn btn-ghost btn-sm"
                      confirm="Confirmer que ce paiement Bitcoin a bien été reçu ? L'abonnement sera activé."
                    >
                      Confirmer le paiement reçu
                    </ConfirmSubmit>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}

        {done.length > 0 && (
          <div className="panel">
            <h2>Historique ({done.length})</h2>
            <TableSearch
              placeholder="Rechercher (client, e-mail, offre)…"
              containerId="orders-history-list"
              rowSelector=".sub-admin-card"
            />
            <div className="sub-admin-list" id="orders-history-list">
              {done.map((o) => (
                <OrderCard key={o.id} order={o} actionable={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function OrderCard({
  order,
  actionable,
}: {
  order: OrderView;
  actionable: boolean;
}) {
  const [cls, label] = STATUS_FR[order.status] ?? ["badge", order.status];
  return (
    <div
      className="sub-admin-card"
      data-search={`${order.title} ${order.user_name} ${order.user_email}`.toLowerCase()}
    >
      <div className="sub-admin-top">
        <div>
          <strong>{order.title}</strong>
          <div className="muted" style={{ fontSize: "0.82rem" }}>
            {KIND_FR[order.kind]} · {formatPrice(order.price_cents)}
            {order.kind === "line" && order.max_connections
              ? ` · ${order.max_connections} écran${order.max_connections > 1 ? "s" : ""}`
              : ""}{" "}
            · {order.renew_sub_id ? "renouvellement" : "nouvel abonnement"} ·
            {PROVIDER_FR[order.payment_provider] ?? order.payment_provider} ·
            commandé le {formatDate(order.created_at)}
          </div>
        </div>
        <span className={`badge ${cls}`}>{label}</span>
      </div>

      <div className="sub-admin-grid">
        <div className="sub-admin-field">
          <span className="k">Client</span>
          <span className="v">
            <Link href={`/admin?user=${order.user_id}`}>{order.user_name}</Link>{" "}
            <span className="muted">· {order.user_email}</span>
          </span>
        </div>
        {order.mac && (
          <div className="sub-admin-field">
            <span className="k">MAC</span>
            <span className="v">{order.mac}</span>
          </div>
        )}
        {(order.want_adult || order.want_french || order.no_adult) && (
          <div className="sub-admin-field">
            <span className="k">Options demandées</span>
            <span className="v" style={{ fontFamily: "inherit" }}>
              {[
                order.want_adult && "🔞 Chaînes adultes",
                order.no_adult && "🚫 Sans chaîne adulte",
                order.want_french && "🇫🇷 Contenu français uniquement",
              ]
                .filter(Boolean)
                .map((t) => (
                  <span key={t as string} className="order-opt-tag">
                    {t}
                  </span>
                ))}
            </span>
          </div>
        )}
        {order.customer_note && (
          <div className="sub-admin-field">
            <span className="k">Message client</span>
            <span className="v">{order.customer_note}</span>
          </div>
        )}
        {order.admin_note && (
          <div className="sub-admin-field">
            <span className="k">Note admin</span>
            <span className="v">{order.admin_note}</span>
          </div>
        )}
        {order.btc_txid && (
          <div className="sub-admin-field">
            <span className="k">Transaction BTC</span>
            <span className="v">
              <a href={mempoolTxUrl(order.btc_txid)} target="_blank" rel="noreferrer">
                {order.btc_txid.slice(0, 16)}…
              </a>
              {actionable && (
                <span className="muted"> · un refus ne rembourse pas automatiquement (renvoi manuel)</span>
              )}
            </span>
          </div>
        )}
        {order.subscription_id && (
          <div className="sub-admin-field">
            <span className="k">Abonnement</span>
            <span className="v">
              <Link href={`/admin?user=${order.user_id}`}>
                #{order.subscription_id}
              </Link>
            </span>
          </div>
        )}
      </div>

      {actionable && (
        <OrderDecision
          orderId={order.id}
          kind={order.kind}
          isRenewal={Boolean(order.renew_sub_id)}
          defaultLabel={order.title}
        />
      )}
    </div>
  );
}
