import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { listOffers, offerById } from "@/lib/data";
import { loadGoldenottCatalog } from "@/lib/goldenott-catalog";
import { formatPrice } from "@/lib/validation";
import { deleteOfferAction, toggleOfferAction } from "@/actions/offer-actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import OfferForm from "./OfferForm";
import type { PkgOption, TplOption } from "../SubscriptionForm";

export const metadata: Metadata = { title: "Offres — Administration" };
export const dynamic = "force-dynamic";

const KIND_FR: Record<string, string> = {
  line: "Ligne M3U",
  mag: "Boîtier MAG",
  code: "Code d'activation",
};

export default async function OffersAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const editId =
    typeof params.edit === "string" ? Number(params.edit) : null;
  const ok = params.ok === "1";

  const [offers, catalog] = await Promise.all([
    listOffers(),
    loadGoldenottCatalog(),
  ]);
  const editing = editId ? await offerById(editId) : null;

  const packages: PkgOption[] = catalog.packages.map((p) => ({
    id: p.id,
    name: p.name,
    credits: p.credits,
    durationLabel: p.durationLabel,
    maxConnections: p.maxConnections,
    isTrial: p.isTrial,
  }));
  const templates: TplOption[] = catalog.templates.map((t) => ({
    id: t.id,
    name: t.name,
    scope: t.scope,
  }));

  return (
    <section style={{ paddingTop: 56 }}>
      <div className="container">
        <div className="admin-tabs">
          <Link href="/admin">Tous les clients</Link>
          <Link href="/admin/commandes">Commandes</Link>
          <Link href="/admin/offres" className="active">Offres</Link>
        </div>

        {ok && (
          <div className="flash flash-success" style={{ marginBottom: 20 }}>
            Offres mises à jour.
          </div>
        )}

        {!catalog.configured ? (
          <div className="panel">
            <h2>Offres</h2>
            <p className="muted">
              L&apos;intégration GoldenOTT n&apos;est pas configurée
              (variable <code>GOLDENOTT_API_KEY</code> absente). Les offres
              self-service nécessitent cette connexion.
            </p>
          </div>
        ) : catalog.error ? (
          <div className="panel">
            <h2>Offres</h2>
            <p className="flash flash-error">
              GoldenOTT injoignable : {catalog.error}
            </p>
          </div>
        ) : (
          <>
            <p className="lead" style={{ marginBottom: 24 }}>
              Une offre emballe un forfait GoldenOTT sous un nom commercial et
              un prix en euros. Les offres actives apparaissent sur la page{" "}
              <Link href="/commander" style={{ color: "var(--text)" }}>
                Commander
              </Link>
              , où le client peut les demander.
            </p>

            <OfferForm
              editing={editing}
              packages={packages}
              templates={templates}
            />

            <div className="panel">
              <h2>Offres existantes ({offers.length})</h2>
              {offers.length === 0 ? (
                <p className="muted">Aucune offre pour le moment.</p>
              ) : (
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Titre</th><th>Type</th><th>Forfait</th>
                        <th>Prix</th><th>Écrans</th><th>Statut</th><th />
                      </tr>
                    </thead>
                    <tbody>
                      {offers.map((o) => {
                        const pkg = packages.find(
                          (p) => p.id === o.goldenott_package_id,
                        );
                        return (
                          <tr key={o.id}>
                            <td>
                              <strong>{o.title}</strong>
                              {o.badge && (
                                <span
                                  className="badge badge-go"
                                  style={{ marginLeft: 8 }}
                                >
                                  {o.badge}
                                </span>
                              )}
                              {o.tagline && (
                                <div className="muted" style={{ fontSize: "0.8rem" }}>
                                  {o.tagline}
                                </div>
                              )}
                            </td>
                            <td>{KIND_FR[o.kind]}</td>
                            <td>
                              {pkg?.name ?? `#${o.goldenott_package_id}`}
                              {pkg?.credits != null && (
                                <div className="muted" style={{ fontSize: "0.8rem" }}>
                                  {pkg.credits} crédits
                                </div>
                              )}
                            </td>
                            <td>{formatPrice(o.price_cents)}</td>
                            <td>
                              {o.included_screens}
                              {o.allow_screens
                                ? ` → ${o.max_screens} (+${formatPrice(o.extra_screen_cents)})`
                                : ""}
                            </td>
                            <td>
                              <span
                                className={`badge ${o.active ? "badge-active" : "badge-suspended"}`}
                              >
                                {o.active ? "Visible" : "Masquée"}
                              </span>
                            </td>
                            <td className="table-actions">
                              <Link
                                className="btn btn-ghost btn-sm"
                                href={`/admin/offres?edit=${o.id}`}
                              >
                                Modifier
                              </Link>
                              <form action={toggleOfferAction} className="inline-form">
                                <input type="hidden" name="offer_id" value={o.id} />
                                <button className="btn btn-ghost btn-sm">
                                  {o.active ? "Masquer" : "Publier"}
                                </button>
                              </form>
                              <form action={deleteOfferAction} className="inline-form">
                                <input type="hidden" name="offer_id" value={o.id} />
                                <ConfirmSubmit
                                  className="btn btn-danger btn-sm"
                                  confirm="Supprimer cette offre ?"
                                >
                                  Suppr.
                                </ConfirmSubmit>
                              </form>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
