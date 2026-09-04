import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { allOrders } from "@/lib/data";
import { loadGoldenottCatalog } from "@/lib/goldenott-catalog";
import { formatDate, formatPrice } from "@/lib/validation";
import OrderDecision from "./OrderDecision";
import type { OrderView, ProviderKind } from "@/lib/types";

export const metadata: Metadata = { title: "Commandes — Administration" };
export const dynamic = "force-dynamic";

const KIND_FR: Record<ProviderKind, string> = {
  line: "Ligne M3U",
  mag: "Boîtier MAG",
  code: "Code d'activation",
};

const STATUS_FR: Record<string, [string, string]> = {
  pending: ["badge-suspended", "En attente"],
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
  const ok = (await searchParams).ok === "1";

  const [orders, catalog] = await Promise.all([
    allOrders(),
    loadGoldenottCatalog(),
  ]);

  const pending = orders.filter((o) => o.status === "pending");
  const done = orders.filter((o) => o.status !== "pending");

  return (
    <section style={{ paddingTop: 56 }}>
      <div className="container">
        <div className="admin-tabs">
          <Link href="/admin">Tous les clients</Link>
          <Link href="/admin/commandes" className="active">Commandes</Link>
          <Link href="/admin/offres">Offres</Link>
          <Link href="/admin/playlist">Playlists MAC</Link>
        </div>

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

        {done.length > 0 && (
          <div className="panel">
            <h2>Historique ({done.length})</h2>
            <div className="sub-admin-list">
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
    <div className="sub-admin-card">
      <div className="sub-admin-top">
        <div>
          <strong>{order.title}</strong>
          <div className="muted" style={{ fontSize: "0.82rem" }}>
            {KIND_FR[order.kind]} · {formatPrice(order.price_cents)}
            {order.kind === "line" && order.max_connections
              ? ` · ${order.max_connections} écran${order.max_connections > 1 ? "s" : ""}`
              : ""}{" "}
            · {order.renew_sub_id ? "renouvellement" : "nouvel abonnement"} ·
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
