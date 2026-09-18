import { requireAdmin } from "@/lib/auth";
import { allOrders } from "@/lib/data";
import { csvResponse, toCsv } from "@/lib/csv";
import { formatDate, formatPrice } from "@/lib/validation";
import type { ProviderKind } from "@/lib/types";

export const dynamic = "force-dynamic";

const KIND_FR: Record<ProviderKind, string> = {
  line: "Ligne M3U",
  mag: "Boîtier MAG",
  code: "Code d'activation",
};

const STATUS_FR: Record<string, string> = {
  awaiting_payment: "En attente de paiement",
  pending: "Payée — à activer",
  fulfilled: "Provisionnée",
  rejected: "Refusée",
  cancelled: "Annulée",
};

export async function GET(): Promise<Response> {
  await requireAdmin();

  const orders = await allOrders();
  const csv = toCsv(
    orders.map((o) => ({
      id: o.id,
      client: o.user_name,
      email: o.user_email,
      titre: o.title,
      type: KIND_FR[o.kind],
      prix: formatPrice(o.price_cents),
      statut: STATUS_FR[o.status] ?? o.status,
      renouvellement: o.renew_sub_id ? "Oui" : "Non",
      commandee_le: formatDate(o.created_at),
      decidee_le: o.decided_at ? formatDate(o.decided_at) : "",
    })),
    [
      { key: "id", label: "ID" },
      { key: "client", label: "Client" },
      { key: "email", label: "E-mail" },
      { key: "titre", label: "Offre" },
      { key: "type", label: "Type" },
      { key: "prix", label: "Prix" },
      { key: "statut", label: "Statut" },
      { key: "renouvellement", label: "Renouvellement" },
      { key: "commandee_le", label: "Commandée le" },
      { key: "decidee_le", label: "Décidée le" },
    ],
  );

  return csvResponse(csv, `commandes-${new Date().toISOString().slice(0, 10)}.csv`);
}
