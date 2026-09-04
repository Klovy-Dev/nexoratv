import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import {
  adminStats,
  allUsers,
  pendingOrdersCount,
  recentGoldenottEvents,
  subscriptionsForUser,
  subscriptionById,
  userById,
} from "@/lib/data";
import { loadGoldenottCatalog } from "@/lib/goldenott-catalog";
import { KIND_LABEL } from "@/lib/goldenott";
import { formatDate } from "@/lib/validation";
import {
  deleteSubscriptionAction,
  deleteUserAction,
  setRoleAction,
} from "@/actions/admin-actions";
import { syncUserSubscriptionsAction } from "@/actions/goldenott-actions";
import SubscriptionForm, {
  type DomainOption,
  type GoldenottFormData,
  type PkgOption,
  type TplOption,
} from "./SubscriptionForm";
import ProviderActions from "./ProviderActions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import CopyButton from "@/components/CopyButton";

export const metadata: Metadata = { title: "Administration" };
export const dynamic = "force-dynamic";

const FLASH: Record<string, string> = {
  "1": "Modifications enregistrées.",
  provision: "Abonnement créé sur GoldenOTT et rattaché au client.",
  extend: "Abonnement prolongé sur GoldenOTT.",
  refund: "Remboursement effectué, abonnement suspendu.",
  sync: "Synchronisation terminée.",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireAdmin();
  const params = await searchParams;
  const pick = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : "");
  const userParam = pick("user");
  const editParam = pick("edit");
  const okParam = pick("ok");
  const errParam = pick("err");
  const creditParam = pick("credit");
  const targetId = userParam ? Number(userParam) : 0;
  const target = targetId ? await userById(targetId) : null;

  return (
    <section style={{ paddingTop: 56 }}>
      <div className="container">
        <div className="admin-tabs">
          <Link href="/admin" className={!target ? "active" : ""}>
            Tous les clients
          </Link>
          <Link href="/admin/commandes">Commandes</Link>
          <Link href="/admin/offres">Offres</Link>
          <Link href="/admin/playlist">Playlists MAC</Link>
          {target && (
            <span className="admin-tabs-current active" style={{ padding: "9px 18px" }}>
              {target.name}
            </span>
          )}
        </div>

        {okParam && (
          <div className="flash flash-success" style={{ marginBottom: 20 }}>
            {FLASH[okParam] ?? "Opération effectuée."}
            {creditParam && ` Crédit revendeur restant : ${creditParam}.`}
          </div>
        )}
        {errParam && (
          <div className="flash flash-error" style={{ marginBottom: 20 }}>
            {errParam}
          </div>
        )}

        {!target ? (
          <AdminOverview />
        ) : (
          <AdminUserDetail
            target={target}
            meId={me.id}
            editId={editParam ? Number(editParam) : null}
          />
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers GoldenOTT partagés                                         */
/* ------------------------------------------------------------------ */

function toPkgOptions(
  packages: Awaited<ReturnType<typeof loadGoldenottCatalog>>["packages"],
): PkgOption[] {
  return packages.map((p) => ({
    id: p.id,
    name: p.name,
    credits: p.credits,
    durationLabel: p.durationLabel,
    maxConnections: p.maxConnections,
    isTrial: p.isTrial,
  }));
}

function toTplOptions(
  templates: Awaited<ReturnType<typeof loadGoldenottCatalog>>["templates"],
): TplOption[] {
  return templates.map((t) => ({ id: t.id, name: t.name, scope: t.scope }));
}

function toDomainOptions(
  domains: Awaited<ReturnType<typeof loadGoldenottCatalog>>["domains"],
): DomainOption[] {
  return domains.map((d) => ({
    id: d.id,
    domain: d.domain,
    forBypass: d.forBypass,
    forTv: d.forTv,
    isDefault: d.isDefault,
  }));
}

/* ------------------------------------------------------------------ */
/*  Vue d'ensemble                                                     */
/* ------------------------------------------------------------------ */

async function AdminOverview() {
  const [stats, users, catalog, pending, events] = await Promise.all([
    adminStats(),
    allUsers(),
    loadGoldenottCatalog(),
    pendingOrdersCount(),
    recentGoldenottEvents(8),
  ]);

  return (
    <>
      <div className="stat-row">
        <div className="stat"><strong>{stats.total_users}</strong><span>comptes au total</span></div>
        <div className="stat"><strong>{stats.total_clients}</strong><span>clients</span></div>
        <div className="stat"><strong>{stats.total_subs}</strong><span>abonnements</span></div>
        <div className="stat"><strong>{stats.active_subs}</strong><span>abonnements actifs</span></div>
      </div>

      {catalog.configured && (
        <div className="panel">
          <h2>Intégration GoldenOTT</h2>
          {catalog.error ? (
            <p className="flash flash-error">
              Connexion impossible : {catalog.error}
            </p>
          ) : (
            <div className="go-status">
              <div className="go-status-item">
                <span>Compte revendeur</span>
                <strong>{catalog.username}</strong>
              </div>
              <div className="go-status-item">
                <span>Crédit disponible</span>
                <strong
                  className={
                    (catalog.credit ?? 0) < 1 ? "go-credit-low" : "go-credit-ok"
                  }
                >
                  {catalog.credit?.toFixed(2)} crédits
                </strong>
              </div>
              <div className="go-status-item">
                <span>Forfaits accessibles</span>
                <strong>{catalog.packages.length}</strong>
              </div>
              <div className="go-status-item">
                <span>Commandes en attente</span>
                <strong className={pending > 0 ? "go-credit-low" : ""}>
                  {pending}
                </strong>
              </div>
            </div>
          )}
          <div className="table-actions" style={{ marginTop: 18 }}>
            <Link href="/admin/commandes" className="btn btn-ghost btn-sm">
              Voir les commandes{pending > 0 ? ` (${pending})` : ""}
            </Link>
            <Link href="/admin/offres" className="btn btn-ghost btn-sm">
              Gérer les offres
            </Link>
          </div>

          {events.length > 0 && (
            <div className="go-log">
              <h3>Dernières opérations</h3>
              <ul>
                {events.map((e) => (
                  <li key={e.id} className={e.ok ? "" : "ko"}>
                    <span className="go-log-when">{formatDate(e.created_at)}</span>
                    <span className="go-log-act">{e.action}</span>
                    <span className="go-log-msg">{e.message || (e.ok ? "OK" : "échec")}</span>
                    <span className="go-log-actor">{e.actor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="panel">
        <h2>Clients inscrits</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Nom</th><th>E-mail</th><th>Rôle</th>
                <th>Abonnements</th><th>Inscrit le</th><th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === "admin" ? "badge-admin" : ""}`}>
                      {u.role === "admin" ? "Admin" : "Client"}
                    </span>
                  </td>
                  <td>{u.sub_count}</td>
                  <td>{formatDate(u.created_at)}</td>
                  <td>
                    <Link className="btn btn-ghost btn-sm" href={`/admin?user=${u.id}`}>
                      Gérer
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Détail d'un client                                                 */
/* ------------------------------------------------------------------ */

async function AdminUserDetail({
  target,
  meId,
  editId,
}: {
  target: { id: number; name: string; email: string; role: string; created_at: string };
  meId: number;
  editId: number | null;
}) {
  const [subs, catalog] = await Promise.all([
    subscriptionsForUser(target.id),
    loadGoldenottCatalog(),
  ]);
  const editing =
    editId != null
      ? await subscriptionById(editId).then((s) =>
          s && s.user_id === target.id ? s : null,
        )
      : null;
  const isSelf = target.id === meId;

  const pkgOptions = toPkgOptions(catalog.packages);
  const goldenott: GoldenottFormData | null = catalog.configured
    ? {
        packages: pkgOptions,
        templates: toTplOptions(catalog.templates),
        domains: toDomainOptions(catalog.domains),
        credit: catalog.credit,
        error: catalog.error,
      }
    : null;

  const hasGoldenottSub = subs.some((s) => s.provider === "goldenott");

  return (
    <>
      <div className="panel">
        <h2>Client — {target.name}</h2>
        <p className="muted" style={{ fontSize: "0.92rem" }}>
          {target.email} · inscrit le {formatDate(target.created_at)} · rôle
          actuel : <strong>{target.role}</strong>
        </p>

        <div className="table-actions" style={{ marginTop: 16 }}>
          <form action={setRoleAction} className="inline-form">
            <input type="hidden" name="user_id" value={target.id} />
            <input
              type="hidden"
              name="role"
              value={target.role === "admin" ? "client" : "admin"}
            />
            <button className="btn btn-ghost btn-sm" disabled={isSelf}>
              {target.role === "admin"
                ? "Rétrograder en client"
                : "Promouvoir administrateur"}
            </button>
          </form>

          <form action={deleteUserAction} className="inline-form">
            <input type="hidden" name="user_id" value={target.id} />
            <ConfirmSubmit
              className="btn btn-danger btn-sm"
              disabled={isSelf}
              confirm="Supprimer définitivement ce compte et tous ses abonnements ?"
            >
              Supprimer le compte
            </ConfirmSubmit>
          </form>
        </div>
      </div>

      <SubscriptionForm
        userId={target.id}
        goldenott={goldenott}
        editing={
          editing
            ? {
                id: editing.id,
                label: editing.label,
                server_url: editing.server_url,
                username: editing.username,
                expires_at: editing.expires_at ?? "",
                status: editing.status,
                note: editing.note,
                screens: editing.screens,
              }
            : null
        }
      />

      <div className="panel">
        <div className="form-mode-head">
          <h2>Abonnements de ce client ({subs.length})</h2>
          {hasGoldenottSub && (
            <form action={syncUserSubscriptionsAction} className="inline-form">
              <input type="hidden" name="user_id" value={target.id} />
              <button className="btn btn-ghost btn-sm">↻ Tout synchroniser</button>
            </form>
          )}
        </div>

        {subs.length === 0 ? (
          <p className="muted">Aucun abonnement pour le moment.</p>
        ) : (
          <div className="sub-admin-list">
            {subs.map((s) => {
              const statusBadge =
                s.status === "suspended" ? (
                  <span className="badge badge-suspended">Suspendu</span>
                ) : s.expired ? (
                  <span className="badge badge-expired">Expiré</span>
                ) : (
                  <span className="badge badge-active">Actif</span>
                );

              return (
                <div className="sub-admin-card" key={s.id}>
                  <div className="sub-admin-top">
                    <div>
                      <strong>{s.label}</strong>
                      <div className="muted" style={{ fontSize: "0.82rem" }}>
                        {s.provider === "goldenott" ? (
                          <>
                            <span className="badge badge-go">GoldenOTT</span>{" "}
                            {s.provider_kind && KIND_LABEL[s.provider_kind]}
                            {s.provider_ref && ` · #${s.provider_ref}`}
                            {s.provider_status && ` · ${s.provider_status}`}
                          </>
                        ) : (
                          <span className="badge">Manuel</span>
                        )}
                      </div>
                    </div>
                    {statusBadge}
                  </div>

                  <div className="sub-admin-grid">
                    <Field label="Serveur">{s.server_url || "—"}</Field>
                    {s.provider === "goldenott" && (
                      <Field label="Domaine">{s.dns_domain || "défaut"}</Field>
                    )}
                    <Field label={s.provider_kind === "mag" ? "MAC" : s.provider_kind === "code" ? "Code" : "Utilisateur"}>
                      {s.provider_kind === "mag"
                        ? s.mac || "—"
                        : s.username || "—"}
                      {(s.username || s.mac) && (
                        <CopyButton value={s.mac || s.username} />
                      )}
                    </Field>
                    {s.provider_kind !== "mag" && s.provider_kind !== "code" && (
                      <Field label="Mot de passe">
                        <code>{s.password || "—"}</code>
                        {s.password && <CopyButton value={s.password} />}
                      </Field>
                    )}
                    <Field label="Écrans">{s.screens ?? "—"}</Field>
                    <Field label="Expire">{formatDate(s.expires_at)}</Field>
                    {s.synced_at && (
                      <Field label="Sync">{formatDate(s.synced_at)}</Field>
                    )}
                  </div>

                  {s.provider === "goldenott" && !catalog.error && (
                    <ProviderActions
                      subId={s.id}
                      userId={target.id}
                      packages={pkgOptions}
                    />
                  )}

                  <div className="table-actions" style={{ marginTop: 12 }}>
                    <Link
                      className="btn btn-ghost btn-sm"
                      href={`/admin?user=${target.id}&edit=${s.id}`}
                    >
                      Modifier (local)
                    </Link>
                    <form action={deleteSubscriptionAction} className="inline-form">
                      <input type="hidden" name="sub_id" value={s.id} />
                      <input type="hidden" name="user_id" value={target.id} />
                      <ConfirmSubmit
                        className="btn btn-danger btn-sm"
                        confirm={
                          s.provider === "goldenott"
                            ? "Retirer cette fiche de NexoraTV ? (l'abonnement reste actif sur GoldenOTT — utilisez « Rembourser » pour l'annuler côté panel)"
                            : "Supprimer cet abonnement ?"
                        }
                      >
                        Retirer
                      </ConfirmSubmit>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sub-admin-field">
      <span className="k">{label}</span>
      <span className="v">{children}</span>
    </div>
  );
}
