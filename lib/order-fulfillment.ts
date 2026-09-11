import "server-only";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { orderById, subscriptionById } from "@/lib/data";
import { loadGoldenottCatalog } from "@/lib/goldenott-catalog";
import { GoldenottError } from "@/lib/goldenott";
import {
  extendSubscriptionLocal,
  prepareLineCredentials,
  provisionSubscription,
} from "@/lib/goldenott-provision";
import { sendOrderAcceptedEmail, sendProvisioningFailedAlert } from "@/lib/order-mail";
import type { OrderView } from "@/lib/types";

/**
 * Provisioning automatique déclenché par le webhook Stripe une fois le
 * paiement confirmé. Volontairement en dehors d'un fichier "use server" :
 * cette logique ne doit être joignable que côté serveur (webhook), jamais
 * exposée comme Server Action invocable depuis le navigateur.
 */

export function errMessages(err: unknown): string[] {
  if (err instanceof GoldenottError) return err.allMessages;
  if (err instanceof Error) return [err.message];
  return ["Erreur inattendue."];
}

/**
 * Tente le provisioning GoldenOTT automatiquement. En cas d'échec technique
 * (panel injoignable, crédit insuffisant…), la commande repasse 'pending'
 * pour qu'un admin la traite à la main depuis /admin/commandes — le client
 * a déjà payé, rien n'est perdu.
 */
export async function fulfillPaidOrder(orderId: number): Promise<void> {
  const order = await orderById(orderId);
  if (!order || order.status !== "awaiting_payment") return;

  if (order.renew_sub_id) {
    await fulfillRenewal(order);
  } else {
    await fulfillNewOrder(order);
  }

  revalidatePath("/profil");
  revalidatePath("/admin/commandes");
}

async function markProvisioningFailed(order: OrderView, message: string): Promise<void> {
  await sql`
    UPDATE iptv_orders SET status = 'pending', admin_note = ${message}
    WHERE id = ${order.id}
  `;
  await sendProvisioningFailedAlert({
    customerName: order.user_name,
    customerEmail: order.user_email,
    title: order.title,
    priceCents: order.price_cents,
    kind: order.kind,
    screens: order.max_connections,
    isRenewal: Boolean(order.renew_sub_id),
    reason: message,
  });
}

async function fulfillRenewal(order: OrderView): Promise<void> {
  const sub = order.renew_sub_id ? await subscriptionById(order.renew_sub_id) : null;
  if (!sub) {
    await markProvisioningFailed(
      order,
      "Paiement reçu, mais l'abonnement à renouveler est introuvable.",
    );
    return;
  }

  try {
    await extendSubscriptionLocal(sub, order.package_id, "stripe", order.title);
  } catch (err) {
    await markProvisioningFailed(
      order,
      `Paiement reçu, prolongation GoldenOTT échouée : ${errMessages(err).join(" ")}`,
    );
    return;
  }

  await sql`
    UPDATE iptv_orders
    SET status = 'fulfilled', subscription_id = ${sub.id}, decided_at = now()
    WHERE id = ${order.id}
  `;
  await sendOrderAcceptedEmail({
    customerName: order.user_name,
    customerEmail: order.user_email,
    title: order.title,
    priceCents: order.price_cents,
    kind: order.kind,
    screens: order.max_connections,
    isRenewal: true,
    subscriptionLabel: sub.label,
  });
}

async function fulfillNewOrder(order: OrderView): Promise<void> {
  const catalog = await loadGoldenottCatalog();
  const isTrial = Boolean(
    catalog.packages.find((p) => p.id === order.package_id)?.isTrial,
  );
  const creds = order.kind === "line" ? prepareLineCredentials("", "") : undefined;

  try {
    await provisionSubscription({
      userId: order.user_id,
      kind: order.kind,
      packageId: order.package_id,
      packageLabel: order.title,
      templateId: order.template_id,
      dnsDomainId: order.dns_domain_id,
      isAdult: order.is_adult,
      isTrial,
      label: order.title,
      note: order.customer_note,
      actor: "stripe",
      username: creds?.username,
      password: creds?.password,
      maxConnections: order.max_connections,
      mac: order.kind === "mag" ? order.mac ?? undefined : undefined,
      orderId: order.id,
    });
  } catch (err) {
    await markProvisioningFailed(
      order,
      `Paiement reçu, provisioning GoldenOTT échoué : ${errMessages(err).join(" ")}`,
    );
    return;
  }

  await sendOrderAcceptedEmail({
    customerName: order.user_name,
    customerEmail: order.user_email,
    title: order.title,
    priceCents: order.price_cents,
    kind: order.kind,
    screens: order.max_connections,
    isRenewal: false,
    subscriptionLabel: order.title,
  });
}
