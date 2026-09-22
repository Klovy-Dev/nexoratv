import type { Offer, ProviderKind } from "@/lib/types";

export type OfferCardData = {
  offer: Offer;
  alreadyPending: boolean;
  trialLocked: boolean;
};

export function groupByKind(cards: OfferCardData[]): [ProviderKind, OfferCardData[]][] {
  const map = new Map<ProviderKind, OfferCardData[]>();
  for (const c of cards) {
    if (!map.has(c.offer.kind)) map.set(c.offer.kind, []);
    map.get(c.offer.kind)!.push(c);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.offer.price_cents - b.offer.price_cents || a.offer.id - b.offer.id);
  }
  return [...map.entries()];
}

/**
 * À l'intérieur d'un type d'offre, regroupe par durée (ex. plusieurs formats
 * d'écrans pour un même « 12 mois ») pour éviter que le tri global par prix
 * n'entremêle les durées entre elles. Groupes de durée triés par leur offre
 * la moins chère ; offres à l'intérieur triées par prix croissant.
 */
export function groupByDuration(cards: OfferCardData[]): [string, OfferCardData[]][] {
  const map = new Map<string, OfferCardData[]>();
  for (const c of cards) {
    const key = c.offer.duration_label || "";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  const groups = [...map.entries()];
  for (const [, list] of groups) {
    list.sort((a, b) => a.offer.price_cents - b.offer.price_cents || a.offer.id - b.offer.id);
  }
  groups.sort((a, b) => (a[1][0]?.offer.price_cents ?? 0) - (b[1][0]?.offer.price_cents ?? 0));
  return groups;
}
