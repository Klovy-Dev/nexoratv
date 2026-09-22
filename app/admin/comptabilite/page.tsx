import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { accountingSummary, listCreditPurchases, listExpenses } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/validation";

export const metadata: Metadata = { title: "Comptabilité — Administration" };
export const dynamic = "force-dynamic";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthBounds(offset = 0): { from: string; to: string } {
  const now = new Date();
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
  const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset + 1, 0));
  return { from: isoDate(first), to: isoDate(last) };
}

function yearBounds(): { from: string; to: string } {
  const now = new Date();
  return {
    from: isoDate(new Date(Date.UTC(now.getUTCFullYear(), 0, 1))),
    to: isoDate(new Date(Date.UTC(now.getUTCFullYear(), 11, 31))),
  };
}

export default async function ComptabilitePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const defaults = monthBounds();
  const from = typeof params.from === "string" && params.from ? params.from : defaults.from;
  const to = typeof params.to === "string" && params.to ? params.to : defaults.to;

  const [summary, purchases, expenses] = await Promise.all([
    accountingSummary(from, to),
    listCreditPurchases(),
    listExpenses(),
  ]);

  const thisMonth = monthBounds();
  const lastMonth = monthBounds(-1);
  const thisYear = yearBounds();
  const marginPositive = summary.marginCents >= 0;

  return (
    <section>
      <div className="container">
        <div className="admin-tabs" style={{ marginBottom: 20 }}>
          <Link href="/admin/comptabilite" className="active">
            Vue d&apos;ensemble
          </Link>
          <Link href="/admin/comptabilite/credits">Achats de crédits</Link>
          <Link href="/admin/comptabilite/depenses">Dépenses</Link>
        </div>

        <div className="panel" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 16 }}>
            <Link className="btn btn-ghost btn-sm" href={`/admin/comptabilite?from=${thisMonth.from}&to=${thisMonth.to}`}>
              Ce mois-ci
            </Link>
            <Link className="btn btn-ghost btn-sm" href={`/admin/comptabilite?from=${lastMonth.from}&to=${lastMonth.to}`}>
              Mois dernier
            </Link>
            <Link className="btn btn-ghost btn-sm" href={`/admin/comptabilite?from=${thisYear.from}&to=${thisYear.to}`}>
              Cette année
            </Link>
            <a
              className="btn btn-ghost btn-sm"
              href={`/api/admin/export/comptabilite?from=${from}&to=${to}`}
              style={{ marginLeft: "auto" }}
            >
              ⬇ Exporter CSV (période)
            </a>
          </div>
          <form style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="from">Du</label>
              <input id="from" name="from" type="date" className="input" defaultValue={from} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="to">Au</label>
              <input id="to" name="to" type="date" className="input" defaultValue={to} />
            </div>
            <SubmitPeriod />
          </form>
        </div>

        <div className="stat-row">
          <div className="stat">
            <strong>{formatPrice(summary.revenueCents)}</strong>
            <span>Chiffre d&apos;affaires ({summary.orderCount} commande{summary.orderCount > 1 ? "s" : ""})</span>
          </div>
          <div className="stat">
            <strong>{formatPrice(summary.costCents)}</strong>
            <span>
              Coûts ({formatPrice(summary.creditCostCents)} crédits + {formatPrice(summary.expenseCents)} dépenses)
            </span>
          </div>
          <div className="stat">
            <strong style={{ color: marginPositive ? "var(--success)" : "var(--danger)" }}>
              {formatPrice(summary.marginCents)}
            </strong>
            <span>Marge nette</span>
          </div>
        </div>

        <div className="sub-admin-grid">
          <div className="sub-admin-card">
            <h2>Derniers achats de crédits</h2>
            {purchases.length === 0 ? (
              <p className="muted">Aucun achat enregistré.</p>
            ) : (
              <ul style={{ listStyle: "none", display: "grid", gap: 10 }}>
                {purchases.slice(0, 5).map((p) => (
                  <li key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span>{formatDate(p.purchased_at)} · {p.credits} crédits</span>
                    <strong>{formatPrice(p.total_price_cents)}</strong>
                  </li>
                ))}
              </ul>
            )}
            <Link className="btn btn-ghost btn-sm" href="/admin/comptabilite/credits" style={{ marginTop: 14 }}>
              Voir tout →
            </Link>
          </div>

          <div className="sub-admin-card">
            <h2>Dernières dépenses</h2>
            {expenses.length === 0 ? (
              <p className="muted">Aucune dépense enregistrée.</p>
            ) : (
              <ul style={{ listStyle: "none", display: "grid", gap: 10 }}>
                {expenses.slice(0, 5).map((e) => (
                  <li key={e.id} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span>{formatDate(e.expense_date)} · {e.label}</span>
                    <strong>{formatPrice(e.amount_cents)}</strong>
                  </li>
                ))}
              </ul>
            )}
            <Link className="btn btn-ghost btn-sm" href="/admin/comptabilite/depenses" style={{ marginTop: 14 }}>
              Voir tout →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SubmitPeriod() {
  return (
    <button type="submit" className="btn btn-primary btn-sm">
      Appliquer
    </button>
  );
}
