import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { listExpenses, expenseById } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/validation";
import { deleteExpenseAction } from "@/actions/expense-actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import TableSearch from "@/components/TableSearch";
import ExpenseForm from "./ExpenseForm";

export const metadata: Metadata = { title: "Dépenses — Comptabilité" };
export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const editId = typeof params.edit === "string" ? Number(params.edit) : null;
  const ok = params.ok;

  const [expenses, editing] = await Promise.all([
    listExpenses(),
    editId ? expenseById(editId) : Promise.resolve(null),
  ]);

  return (
    <section>
      <div className="container">
        <div className="admin-tabs" style={{ marginBottom: 20 }}>
          <Link href="/admin/comptabilite">Vue d&apos;ensemble</Link>
          <Link href="/admin/comptabilite/credits">Achats de crédits</Link>
          <Link href="/admin/comptabilite/depenses" className="active">
            Dépenses
          </Link>
        </div>

        {ok === "1" && (
          <div className="flash flash-success" style={{ marginBottom: 20 }}>
            Dépense enregistrée.
          </div>
        )}
        {ok === "del" && (
          <div className="flash flash-success" style={{ marginBottom: 20 }}>
            Dépense supprimée.
          </div>
        )}

        <ExpenseForm editing={editing} />

        <div className="panel">
          <h2>Dépenses ({expenses.length})</h2>
          {expenses.length === 0 ? (
            <p className="muted">Aucune dépense enregistrée pour le moment.</p>
          ) : (
            <>
              <TableSearch
                placeholder="Rechercher une dépense (libellé, catégorie)…"
                containerId="expenses-table-body"
                rowSelector="tr"
              />
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Libellé</th>
                      <th>Catégorie</th>
                      <th>Montant</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody id="expenses-table-body">
                    {expenses.map((e) => (
                      <tr key={e.id} data-search={`${e.label} ${e.category}`.toLowerCase()}>
                        <td>{formatDate(e.expense_date)}</td>
                        <td>
                          {e.label}
                          {e.note && (
                            <div className="muted" style={{ fontSize: "0.8rem" }}>
                              {e.note}
                            </div>
                          )}
                        </td>
                        <td>{e.category || "—"}</td>
                        <td>{formatPrice(e.amount_cents)}</td>
                        <td className="table-actions">
                          <Link
                            className="btn btn-ghost btn-sm"
                            href={`/admin/comptabilite/depenses?edit=${e.id}`}
                          >
                            Modifier
                          </Link>
                          <form action={deleteExpenseAction} className="inline-form">
                            <input type="hidden" name="id" value={e.id} />
                            <ConfirmSubmit
                              className="btn btn-danger btn-sm"
                              confirm="Supprimer cette dépense ?"
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
