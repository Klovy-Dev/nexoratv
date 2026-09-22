import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { listCreditPurchases, creditPurchaseById } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/validation";
import { deleteCreditPurchaseAction } from "@/actions/credit-purchase-actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import TableSearch from "@/components/TableSearch";
import CreditPurchaseForm from "./CreditPurchaseForm";

export const metadata: Metadata = { title: "Achats de crédits — Comptabilité" };
export const dynamic = "force-dynamic";

export default async function CreditPurchasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const editId = typeof params.edit === "string" ? Number(params.edit) : null;
  const ok = params.ok;

  const [purchases, editing] = await Promise.all([
    listCreditPurchases(),
    editId ? creditPurchaseById(editId) : Promise.resolve(null),
  ]);

  return (
    <section>
      <div className="container">
        <div className="admin-tabs" style={{ marginBottom: 20 }}>
          <Link href="/admin/comptabilite">Vue d&apos;ensemble</Link>
          <Link href="/admin/comptabilite/credits" className="active">
            Achats de crédits
          </Link>
          <Link href="/admin/comptabilite/depenses">Dépenses</Link>
        </div>

        {ok === "1" && (
          <div className="flash flash-success" style={{ marginBottom: 20 }}>
            Achat enregistré.
          </div>
        )}
        {ok === "del" && (
          <div className="flash flash-success" style={{ marginBottom: 20 }}>
            Achat supprimé.
          </div>
        )}

        <CreditPurchaseForm editing={editing} />

        <div className="panel">
          <h2>Achats de crédits ({purchases.length})</h2>
          {purchases.length === 0 ? (
            <p className="muted">Aucun achat enregistré pour le moment.</p>
          ) : (
            <>
              <TableSearch
                placeholder="Rechercher un achat (note)…"
                containerId="credit-purchases-table-body"
                rowSelector="tr"
              />
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Crédits</th>
                      <th>Prix payé</th>
                      <th>Prix / crédit</th>
                      <th>Note</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody id="credit-purchases-table-body">
                    {purchases.map((p) => (
                      <tr key={p.id} data-search={p.note.toLowerCase()}>
                        <td>{formatDate(p.purchased_at)}</td>
                        <td>{p.credits}</td>
                        <td>{formatPrice(p.total_price_cents)}</td>
                        <td>{formatPrice(Math.round(p.total_price_cents / p.credits))}</td>
                        <td>{p.note || "—"}</td>
                        <td className="table-actions">
                          <Link
                            className="btn btn-ghost btn-sm"
                            href={`/admin/comptabilite/credits?edit=${p.id}`}
                          >
                            Modifier
                          </Link>
                          <form action={deleteCreditPurchaseAction} className="inline-form">
                            <input type="hidden" name="id" value={p.id} />
                            <ConfirmSubmit
                              className="btn btn-danger btn-sm"
                              confirm="Supprimer cet achat ?"
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
            </>
          )}
        </div>
      </div>
    </section>
  );
}
