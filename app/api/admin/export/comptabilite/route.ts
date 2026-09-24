import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { creditPurchasesForPeriod, expensesForPeriod, fulfilledOrdersForPeriod } from "@/lib/data";
import { csvResponse, toCsv } from "@/lib/csv";
import { formatDate } from "@/lib/validation";

export const dynamic = "force-dynamic";

type LedgerRow = {
  sortKey: number;
  date: string;
  type: string;
  label: string;
  amount: string;
  detail: string;
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest): Promise<Response> {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const defaultFrom = isoDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
  const defaultTo = isoDate(now);
  const from = searchParams.get("from") || defaultFrom;
  const to = searchParams.get("to") || defaultTo;

  const [orders, purchases, expenses] = await Promise.all([
    fulfilledOrdersForPeriod(from, to),
    creditPurchasesForPeriod(from, to),
    expensesForPeriod(from, to),
  ]);

  const rows: LedgerRow[] = [
    ...orders.map((o) => ({
      sortKey: +new Date(o.paid_at),
      date: formatDate(o.paid_at),
      type: "Revenu",
      label: o.title,
      amount: (o.price_cents / 100).toFixed(2),
      detail:
        o.payment_provider === "paypal"
          ? "PayPal"
          : o.payment_provider === "bitcoin"
            ? "Bitcoin"
            : "Stripe",
    })),
    ...purchases.map((p) => ({
      sortKey: +new Date(p.purchased_at),
      date: formatDate(p.purchased_at),
      type: "Achat crédits",
      label: `${p.credits} crédits`,
      amount: (-p.total_price_cents / 100).toFixed(2),
      detail: p.note,
    })),
    ...expenses.map((e) => ({
      sortKey: +new Date(e.expense_date),
      date: formatDate(e.expense_date),
      type: "Dépense",
      label: e.label,
      amount: (-e.amount_cents / 100).toFixed(2),
      detail: e.category,
    })),
  ].sort((a, b) => a.sortKey - b.sortKey);

  const csv = toCsv(rows, [
    { key: "date", label: "Date" },
    { key: "type", label: "Type" },
    { key: "label", label: "Libellé" },
    { key: "amount", label: "Montant (€)" },
    { key: "detail", label: "Détail" },
  ]);

  return csvResponse(csv, `comptabilite-${from}-au-${to}.csv`);
}
