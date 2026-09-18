import { requireAdmin } from "@/lib/auth";
import { allUsers } from "@/lib/data";
import { csvResponse, toCsv } from "@/lib/csv";
import { formatDate } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  await requireAdmin();

  const users = await allUsers();
  const csv = toCsv(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role === "admin" ? "Admin" : "Client",
      created_at: formatDate(u.created_at),
      sub_count: u.sub_count,
      last_sub_at: u.last_sub_at ? formatDate(u.last_sub_at) : "",
    })),
    [
      { key: "id", label: "ID" },
      { key: "name", label: "Nom" },
      { key: "email", label: "E-mail" },
      { key: "role", label: "Rôle" },
      { key: "created_at", label: "Inscrit le" },
      { key: "sub_count", label: "Nb abonnements" },
      { key: "last_sub_at", label: "Dernier abonnement" },
    ],
  );

  return csvResponse(csv, `clients-${new Date().toISOString().slice(0, 10)}.csv`);
}
