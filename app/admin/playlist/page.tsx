import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { listDevicePlaylists, devicePlaylistById } from "@/lib/data";
import { formatDate } from "@/lib/validation";
import { deleteDevicePlaylistAction } from "@/actions/device-playlist-actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import DevicePlaylistForm from "./DevicePlaylistForm";

export const metadata: Metadata = { title: "Playlists MAC — Administration" };
export const dynamic = "force-dynamic";

export default async function DevicePlaylistAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const editId = typeof params.edit === "string" ? Number(params.edit) : null;
  const ok = params.ok;

  const [playlists, editing] = await Promise.all([
    listDevicePlaylists(),
    editId ? devicePlaylistById(editId) : Promise.resolve(null),
  ]);

  return (
    <section style={{ paddingTop: 56 }}>
      <div className="container">
        <div className="admin-tabs">
          <Link href="/admin">Tous les clients</Link>
          <Link href="/admin/commandes">Commandes</Link>
          <Link href="/admin/offres">Offres</Link>
          <Link href="/admin/playlist" className="active">Playlists MAC</Link>
        </div>

        {ok === "1" && (
          <div className="flash flash-success" style={{ marginBottom: 20 }}>
            Playlist enregistrée.
          </div>
        )}
        {ok === "del" && (
          <div className="flash flash-success" style={{ marginBottom: 20 }}>
            Playlist supprimée.
          </div>
        )}

        <p className="lead" style={{ marginBottom: 24 }}>
          Chaque appareil NexoraTV génère une adresse MAC unique (visible dans
          Sources → <em>Activer par adresse MAC</em>). Assignez-lui ici un
          lien M3U : l&apos;application le charge automatiquement, sans que le
          client voie jamais l&apos;URL.
        </p>

        <DevicePlaylistForm editing={editing} />

        <div className="panel">
          <h2>Playlists assignées ({playlists.length})</h2>
          {playlists.length === 0 ? (
            <p className="muted">Aucune playlist assignée pour le moment.</p>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>MAC</th>
                    <th>Nom</th>
                    <th>Statut</th>
                    <th>Ajoutée le</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {playlists.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <code>{p.mac}</code>
                      </td>
                      <td>
                        {p.name}
                        {p.note && (
                          <div className="muted" style={{ fontSize: "0.8rem" }}>
                            {p.note}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${p.active ? "badge-active" : "badge-suspended"}`}
                        >
                          {p.active ? "Active" : "Désactivée"}
                        </span>
                      </td>
                      <td>{formatDate(p.created_at)}</td>
                      <td className="table-actions">
                        <Link
                          className="btn btn-ghost btn-sm"
                          href={`/admin/playlist?edit=${p.id}`}
                        >
                          Modifier
                        </Link>
                        <form action={deleteDevicePlaylistAction} className="inline-form">
                          <input type="hidden" name="id" value={p.id} />
                          <ConfirmSubmit
                            className="btn btn-danger btn-sm"
                            confirm="Supprimer cette playlist ?"
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
      </div>
    </section>
  );
}
