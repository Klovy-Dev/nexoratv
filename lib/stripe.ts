import "server-only";
import Stripe from "stripe";

/**
 * Client Stripe (paiement par carte des commandes IPTV).
 * Créé paresseusement : sans STRIPE_SECRET_KEY, le build reste possible et
 * les pages qui en dépendent redirigent simplement vers /commander.
 */

let client: Stripe | null = null;

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY absente : le paiement par carte n'est pas configuré.",
      );
    }
    client = new Stripe(key);
  }
  return client;
}
