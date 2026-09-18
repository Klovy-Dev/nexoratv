import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { recentGoldenottEvents } from "@/lib/data";
import { KIND_LABEL } from "@/lib/goldenott";
import { formatDateTime } from "@/lib/validation";

export const metadata: Metadata = { title: "Journal — Administration" };
export const dynamic = "force-dynamic";

const ACTION_FR: Record<string, string> = {
  create: "Création",
  extend: "Prolongation",
  refund: "Remboursement",
  sync: "Synchronisation",
};

export default async function JournalAdminPage() {
  await requireAdmin();
  const events = await recentGoldenottEvents(150);

  return (
    <section>
      <div className="container">
        <p className="lead" style={{ marginBottom: 24 }}>
          Journal des appels au panel GoldenOTT (création, prolongation,
          remboursement, synchronisation) — les 150 plus récents, du plus
          récent au plus ancien. Utile pour retrouver la cause d&apos;un
          échec ou vérifier une action passée.
        </p>

        <div className="panel">
          <h2>Événements ({events.length})</h2>
          {events.length === 0 ? (
            <p className="muted">Aucun événement pour le moment.</p>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Acteur</th>
                    <th>Action</th>
                    <th>Type</th>
                    <th>Réf.</th>
                    <th>Résultat</th>
                    <th>Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(e.created_at)}</td>
                      <td>{e.actor}</td>
                      <td>{ACTION_FR[e.action] ?? e.action}</td>
                      <td>{e.kind ? KIND_LABEL[e.kind] : "—"}</td>
                      <td>
                        {e.subscription_id
                          ? `abo #${e.subscription_id}`
                          : (e.provider_ref ?? "—")}
                      </td>
                      <td>
                        <span className={`badge ${e.ok ? "badge-active" : "badge-expired"}`}>
                          {e.ok ? "OK" : "Échec"}
                        </span>
                      </td>
                      <td style={{ maxWidth: 360 }}>{e.message}</td>
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
