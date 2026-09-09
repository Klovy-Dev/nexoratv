import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { listTutoSections, tutoSectionById } from "@/lib/data";
import { formatDate } from "@/lib/validation";
import { deleteTutoSectionAction } from "@/actions/tuto-actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import TutoSectionForm from "./TutoSectionForm";

export const metadata: Metadata = { title: "Page Tuto — Administration" };
export const dynamic = "force-dynamic";

export default async function TutoAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const editId = typeof params.edit === "string" ? Number(params.edit) : null;
  const ok = params.ok;

  const [sections, editing] = await Promise.all([
    listTutoSections(),
    editId ? tutoSectionById(editId) : Promise.resolve(null),
  ]);

  return (
    <section style={{ paddingTop: 56 }}>
      <div className="container">
        <div className="admin-tabs">
          <Link href="/admin">Tous les clients</Link>
          <Link href="/admin/commandes">Commandes</Link>
          <Link href="/admin/offres">Offres</Link>
          <Link href="/admin/playlist">Playlists MAC</Link>
          <Link href="/admin/tuto" className="active">Page Tuto</Link>
        </div>

        {ok === "1" && (
          <div className="flash flash-success" style={{ marginBottom: 20 }}>
            Section enregistrée.
          </div>
        )}
        {ok === "del" && (
          <div className="flash flash-success" style={{ marginBottom: 20 }}>
            Section supprimée.
          </div>
        )}

        <p className="lead" style={{ marginBottom: 24 }}>
          Ces sections composent la page publique{" "}
          <Link href="/tuto">/tuto</Link>. Elles s&apos;affichent dans
          l&apos;ordre du champ <em>Ordre</em>. Rédigez le contenu directement
          dans l&apos;éditeur ci-dessous.
        </p>

        <TutoSectionForm
          editing={editing}
          nextSort={(sections.at(-1)?.sort ?? 0) + 10}
        />

        <div className="panel">
          <h2>Sections ({sections.length})</h2>
          {sections.length === 0 ? (
            <p className="muted">Aucune section pour le moment.</p>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Ordre</th>
                    <th>Titre</th>
                    <th>Statut</th>
                    <th>Modifiée le</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sections.map((s) => (
                    <tr key={s.id}>
                      <td>{s.sort}</td>
                      <td>
                        {s.icon && <span style={{ marginRight: 6 }}>{s.icon}</span>}
                        {s.title}
                      </td>
                      <td>
                        <span
                          className={`badge ${s.published ? "badge-active" : "badge-suspended"}`}
                        >
                          {s.published ? "Publiée" : "Masquée"}
                        </span>
                      </td>
                      <td>{formatDate(s.updated_at)}</td>
                      <td className="table-actions">
                        <Link
                          className="btn btn-ghost btn-sm"
                          href={`/admin/tuto?edit=${s.id}`}
                        >
                          Modifier
                        </Link>
                        <form action={deleteTutoSectionAction} className="inline-form">
                          <input type="hidden" name="id" value={s.id} />
                          <ConfirmSubmit
                            className="btn btn-danger btn-sm"
                            confirm="Supprimer cette section ?"
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
