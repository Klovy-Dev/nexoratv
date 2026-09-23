import { loadGoldenottCatalog } from "@/lib/goldenott-catalog";
import type { DomainOption, PkgOption, TplOption } from "../SubscriptionForm";

/** Catalogue GoldenOTT mis en forme pour les listes déroulantes de OfferForm. */
export async function loadOfferCatalog() {
  const catalog = await loadGoldenottCatalog();

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
  const domains: DomainOption[] = catalog.domains.map((d) => ({
    id: d.id,
    domain: d.domain,
    forBypass: d.forBypass,
    forTv: d.forTv,
    isDefault: d.isDefault,
  }));

  return {
    configured: catalog.configured,
    error: catalog.error,
    packages,
    templates,
    domains,
  };
}
