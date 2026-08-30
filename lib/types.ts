export type Role = "client" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export type SubProvider = "manual" | "goldenott";
export type ProviderKind = "line" | "mag" | "code";

export interface Subscription {
  id: number;
  user_id: number;
  label: string;
  server_url: string;
  username: string;
  password_enc: string;
  expires_at: string | null;
  status: "active" | "suspended";
  note: string;
  screens: number | null;
  created_at: string;
  /* --- Intégration GoldenOTT --- */
  provider: SubProvider;
  provider_kind: ProviderKind | null;
  /** identifiant de l'abonnement côté GoldenOTT */
  provider_ref: string | null;
  /** dernier package GoldenOTT utilisé (souscription / prolongation) */
  package_id: number | null;
  package_label: string | null;
  /** dernier statut connu côté GoldenOTT (Active / Expired / Banned…) */
  provider_status: string | null;
  /** adresse MAC (abonnements MAG) */
  mac: string | null;
  /** lien QR de mise à jour des bouquets */
  qr_url: string | null;
  synced_at: string | null;
  /** domaine DNS GoldenOTT assigné (id + libellé) */
  dns_domain_id: number | null;
  dns_domain: string | null;
}

/** Abonnement prêt pour l'affichage : mot de passe déchiffré + état calculé. */
export interface SubscriptionView
  extends Omit<Subscription, "password_enc"> {
  password: string;
  expired: boolean;
}

/* ---------- Offres & commandes (self-service) ---------- */

export interface Offer {
  id: number;
  kind: ProviderKind;
  goldenott_package_id: number;
  goldenott_template_id: number | null;
  dns_domain_id: number | null;
  title: string;
  tagline: string;
  duration_label: string;
  price_cents: number;
  /** écrans compris dans le prix de base (généralement 1) */
  included_screens: number;
  /** le client peut ajouter des écrans sur la page Commander */
  allow_screens: boolean;
  /** supplément par écran au-delà des écrans inclus, en centimes */
  extra_screen_cents: number;
  /** plafond d'écrans sélectionnables */
  max_screens: number;
  /** bandeau mis en avant sur /commander (ex. « Best Seller ») ; vide = aucun */
  badge: string;
  /** @deprecated remplacé par included_screens — conservé pour compat DB */
  max_connections: number | null;
  is_adult: boolean;
  active: boolean;
  sort: number;
  created_at: string;
}

/** Calcule le prix total d'une offre pour un nombre d'écrans donné. */
export function offerPriceCents(
  offer: Pick<
    Offer,
    "price_cents" | "included_screens" | "extra_screen_cents" | "allow_screens"
  >,
  screens: number,
): number {
  if (!offer.allow_screens) return offer.price_cents;
  const extra = Math.max(0, screens - (offer.included_screens || 1));
  return offer.price_cents + extra * offer.extra_screen_cents;
}

export type OrderStatus = "pending" | "fulfilled" | "rejected" | "cancelled";

export interface Order {
  id: number;
  user_id: number;
  offer_id: number | null;
  kind: ProviderKind;
  title: string;
  price_cents: number;
  package_id: number;
  template_id: number | null;
  dns_domain_id: number | null;
  max_connections: number | null;
  is_adult: boolean;
  mac: string | null;
  renew_sub_id: number | null;
  status: OrderStatus;
  subscription_id: number | null;
  customer_note: string;
  admin_note: string;
  created_at: string;
  decided_at: string | null;
}

/** Commande enrichie du nom / e-mail du client (vue admin). */
export interface OrderView extends Order {
  user_name: string;
  user_email: string;
}

export type FormState = {
  error?: string;
  fieldErrors?: string[];
  ok?: boolean;
};

export interface Review {
  id: number;
  user_id: number;
  rating: number;
  body: string;
  created_at: string;
  name: string;
}

export interface ReviewStats {
  count: number;
  average: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}
