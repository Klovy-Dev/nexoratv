import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { offerById } from "@/lib/data";
import OfferForm from "../OfferForm";
import { loadOfferCatalog } from "../catalog-options";

export const metadata: Metadata = { title: "Modifier l'offre — Administration" };
export const dynamic = "force-dynamic";

export default async function EditOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const offerId = Number(id);
  if (!Number.isInteger(offerId) || offerId <= 0) notFound();

  const [offer, catalog] = await Promise.all([
    offerById(offerId),
    loadOfferCatalog(),
  ]);
  if (!offer) notFound();

  return (
    <section>
      <div className="container">
        <p style={{ marginBottom: 20 }}>
          <Link href="/admin/offres" className="btn btn-ghost btn-sm">
            ← Retour aux offres
          </Link>
        </p>

        {!catalog.configured || catalog.error ? (
          <div className="panel">
            <h2>{offer.title}</h2>
            <p className="flash flash-error">
              {catalog.error
                ? `GoldenOTT injoignable : ${catalog.error}`
                : "L'intégration GoldenOTT n'est pas configurée."}
            </p>
            <p className="muted" style={{ marginTop: 8 }}>
              Impossible de modifier une offre tant que le catalogue (forfaits,
              templates, domaines) n&apos;est pas accessible.
            </p>
          </div>
        ) : (
          <OfferForm
            key={offer.id}
            editing={offer}
            packages={catalog.packages}
            templates={catalog.templates}
            domains={catalog.domains}
          />
        )}
      </div>
    </section>
  );
}
