import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import {
  adminStats,
  allUsers,
  subscriptionsForUser,
  subscriptionById,
  userById,
} from "@/lib/data";
import { formatDate } from "@/lib/validation";
import {
  deleteSubscriptionAction,
  deleteUserAction,
  setRoleAction,
} from "@/actions/admin-actions";
import SubscriptionForm from "./SubscriptionForm";
import ConfirmSubmit from "@/components/ConfirmSubmit";

export const metadata: Metadata = { title: "Administration" };
export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireAdmin();
  const params = await searchParams;
  const userParam = typeof params.user === "string" ? params.user : "";
  const editParam = typeof params.edit === "string" ? params.edit : "";
  const okParam = typeof params.ok === "string" ? params.ok : "";
  const targetId = userParam ? Number(userParam) : 0;
  const target = targetId ? await userById(targetId) : null;

  return (
    <section style={{ paddingTop: 56 }}>
      <div className="container">
        <div className="admin-tabs">
          <Link href="/admin" className={!target ? "active" : ""}>
            Tous les clients
          </Link>
          {target && (
            <span className="admin-tabs-current active" style={{ padding: "9px 18px" }}>
              {target.name}
            </span>
          )}
        </div>

        {okParam && (
          <div className="flash flash-success" style={{ marginBottom: 20 }}>
            Modifications enregistrées.
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

async function AdminOverview() {
  const [stats, users] = await Promise.all([adminStats(), allUsers()]);

  return (
    <>
      <div className="stat-row">
        <div className="stat"><strong>{stats.total_users}</strong><span>comptes au total</span></div>
        <div className="stat"><strong>{stats.total_clients}</strong><span>clients</span></div>
        <div className="stat"><strong>{stats.total_subs}</strong><span>abonnements</span></div>
        <div className="stat"><strong>{stats.active_subs}</strong><span>abonnements actifs</span></div>
      </div>

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

async function AdminUserDetail({
  target,
  meId,
  editId,
}: {
  target: { id: number; name: string; email: string; role: string; created_at: string };
  meId: number;
  editId: number | null;
}) {
  const subs = await subscriptionsForUser(target.id);
  const editing =
    editId != null
      ? (await subscriptionById(editId).then((s) =>
          s && s.user_id === target.id ? s : null,
        ))
      : null;
  const isSelf = target.id === meId;

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
        <h2>Abonnements de ce client ({subs.length})</h2>
        {subs.length === 0 ? (
          <p className="muted">Aucun abonnement pour le moment.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Libellé</th><th>Serveur</th><th>Utilisateur</th>
                  <th>Mot de passe</th><th>Écrans</th><th>Expire</th><th>Statut</th><th />
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id}>
                    <td>{s.label}</td>
                    <td style={{ maxWidth: 200, wordBreak: "break-all" }}>
                      {s.server_url || "—"}
                    </td>
                    <td>{s.username || "—"}</td>
                    <td><code>{s.password || "—"}</code></td>
                    <td>{s.screens ?? "—"}</td>
                    <td>{formatDate(s.expires_at)}</td>
                    <td>
                      {s.status === "suspended" ? (
                        <span className="badge badge-suspended">Suspendu</span>
                      ) : s.expired ? (
                        <span className="badge badge-expired">Expiré</span>
                      ) : (
                        <span className="badge badge-active">Actif</span>
                      )}
                    </td>
                    <td className="table-actions">
                      <Link
                        className="btn btn-ghost btn-sm"
                        href={`/admin?user=${target.id}&edit=${s.id}`}
                      >
                        Modifier
                      </Link>
                      <form action={deleteSubscriptionAction} className="inline-form">
                        <input type="hidden" name="sub_id" value={s.id} />
                        <input type="hidden" name="user_id" value={target.id} />
                        <ConfirmSubmit
                          className="btn btn-danger btn-sm"
                          confirm="Supprimer cet abonnement ?"
                        >
                          Suppr.
                        </ConfirmSubmit>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
