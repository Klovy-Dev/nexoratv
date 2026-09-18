import "server-only";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { grantReferralReward, orderById, subscriptionById } from "@/lib/data";
import { isOneYearOrMorePackage, loadGoldenottCatalog } from "@/lib/goldenott-catalog";
import { GoldenottError, lineM3uUrl } from "@/lib/goldenott";
import {
  extendSubscriptionLocal,
  prepareLineCredentials,
  provisionSubscription,
  resolveProvisioningOptions,
} from "@/lib/goldenott-provision";
import { sendOrderAcceptedEmail, sendProvisioningFailedAlert } from "@/lib/order-mail";
import { notifyOrderWebhook } from "@/lib/discord-webhook";
import { formatPrice } from "@/lib/validation";
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
  // Verrou optimiste : bascule atomiquement 'awaiting_payment' → 'pending'.
  // Un simple SELECT puis vérification du statut laisse une fenêtre de
  // course entre deux déclencheurs concurrents pour le même paiement (ex.
  // PayPal : le retour navigateur ET le webhook appellent tous les deux
  // cette fonction, parfois à quelques millisecondes d'écart) — les deux
  // liraient 'awaiting_payment' avant que l'un des deux ne l'ait changé, et
  // provisionneraient chacun un abonnement pour le même paiement. La clause
  // WHERE ci-dessous est appliquée atomiquement par Postgres : un seul des
  // appels concurrents peut « gagner » la ligne.
  const claimed = (await sql`
    UPDATE iptv_orders SET status = 'pending', paid_at = COALESCE(paid_at, now())
    WHERE id = ${orderId} AND status = 'awaiting_payment'
    RETURNING id
  `) as unknown as { id: number }[];
  if (claimed.length === 0) return;

  const order = await orderById(orderId);
  if (!order) return;

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
  await notifyOrderWebhook({
    title: '⚠️ Provisioning automatique échoué — action requise',
    description: `**${order.user_name}** (${order.user_email})\n${order.title} — ${formatPrice(order.price_cents)}`,
    color: 0xe74c3c,
    fields: [{ name: 'Raison', value: message.slice(0, 1000) }],
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
    m3uUrl:
      sub.provider_kind === "line"
        ? lineM3uUrl(sub.server_url, sub.username, sub.password)
        : null,
  });
  await notifyOrderWebhook({
    title: '🔁 Renouvellement traité',
    description: `**${order.user_name}** (${order.user_email})\n${order.title} — ${formatPrice(order.price_cents)}`,
    color: 0x2ecc71,
  });
}

async function fulfillNewOrder(order: OrderView): Promise<void> {
  const catalog = await loadGoldenottCatalog();
  const isTrial = Boolean(
    catalog.packages.find((p) => p.id === order.package_id)?.isTrial,
  );
  const creds = order.kind === "line" ? prepareLineCredentials("", "") : undefined;
  const { isAdult, templateId } = resolveProvisioningOptions(order, catalog);

  let subscriptionId: number;
  try {
    ({ subscriptionId } = await provisionSubscription({
      userId: order.user_id,
      kind: order.kind,
      packageId: order.package_id,
      packageLabel: order.title,
      templateId,
      dnsDomainId: order.dns_domain_id,
      isAdult,
      isTrial,
      label: order.title,
      note: order.customer_note,
      actor: "stripe",
      username: creds?.username,
      password: creds?.password,
      maxConnections: order.max_connections,
      mac: order.kind === "mag" ? order.mac ?? undefined : undefined,
      orderId: order.id,
    }));
  } catch (err) {
    await markProvisioningFailed(
      order,
      `Paiement reçu, provisioning GoldenOTT échoué : ${errMessages(err).join(" ")}`,
    );
    return;
  }

  const newSub = order.kind === "line" ? await subscriptionById(subscriptionId) : null;

  await sendOrderAcceptedEmail({
    customerName: order.user_name,
    customerEmail: order.user_email,
    title: order.title,
    priceCents: order.price_cents,
    kind: order.kind,
    screens: order.max_connections,
    isRenewal: false,
    subscriptionLabel: order.title,
    m3uUrl: newSub
      ? lineM3uUrl(newSub.server_url, newSub.username, newSub.password)
      : null,
  });
  await notifyOrderWebhook({
    title: '🛒 Nouvelle commande provisionnée',
    description: `**${order.user_name}** (${order.user_email})\n${order.title} — ${formatPrice(order.price_cents)}`,
    color: 0x2ecc71,
  });

  // Parrainage : ne doit jamais faire échouer l'activation déjà réussie.
  try {
    await grantReferralReward(order, isOneYearOrMorePackage(catalog, order.package_id));
  } catch (err) {
    console.error("[order-fulfillment] récompense de parrainage échouée :", err);
  }
}
