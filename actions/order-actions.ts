"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import {
  hasUsedTrial,
  offerById,
  orderById,
  subscriptionById,
} from "@/lib/data";
import {
  isTrialPackage,
  loadGoldenottCatalog,
  trialPackageIds,
} from "@/lib/goldenott-catalog";
import {
  extendSubscriptionLocal,
  prepareLineCredentials,
  provisionSubscription,
  validateLineCredentials,
} from "@/lib/goldenott-provision";
import { appOrigin } from "@/lib/mail";
import { errMessages } from "@/lib/order-fulfillment";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { isMac, normalizeMac, str } from "@/lib/validation";
import { sendOrderAcceptedEmail, sendOrderRejectedEmail } from "@/lib/order-mail";
import { offerPriceCents, type FormState } from "@/lib/types";

/**
 * Ouvre une session Stripe Checkout pour une commande déjà enregistrée
 * (statut 'awaiting_payment') et enregistre son identifiant. Renvoie l'URL
 * de paiement hébergée par Stripe vers laquelle rediriger le client.
 */
async function createCheckoutSession(opts: {
  orderId: number;
  userEmail: string;
  title: string;
  priceCents: number;
  cancelPath: string;
}): Promise<string> {
  const site = await appOrigin();
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: opts.userEmail,
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { name: opts.title },
          unit_amount: opts.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: { order_id: String(opts.orderId) },
    success_url: `${site}/profil?commande=1`,
    cancel_url: `${site}${opts.cancelPath}?annule=1`,
  });

  if (!session.url) {
    throw new Error("Stripe n'a pas renvoyé d'URL de paiement.");
  }

  await sql`
    UPDATE iptv_orders SET stripe_session_id = ${session.id} WHERE id = ${opts.orderId}
  `;

  return session.url;
}

/* ================================================================== */
/*  CÔTÉ CLIENT                                                         */
/* ================================================================== */

/** Le client commande une offre (nouvel abonnement). */
export async function createOrderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  if (!stripeConfigured()) {
    return {
      fieldErrors: ["Le paiement par carte n'est pas configuré pour le moment."],
    };
  }

  const offerId = Number(formData.get("offer_id")) || 0;
  const customerNote = str(formData.get("customer_note")).slice(0, 500);
  const wantAdult = formData.get("want_adult") === "on";
  const wantFrench = formData.get("want_french") === "on";
  let mac = str(formData.get("mac"));

  const offer = await offerById(offerId);
  if (!offer || !offer.active) {
    return { fieldErrors: ["Cette offre n'est plus disponible."] };
  }

  // L'essai n'est autorisé qu'une seule fois par compte.
  const catalog = await loadGoldenottCatalog();
  if (
    isTrialPackage(catalog, offer.goldenott_package_id) &&
    (await hasUsedTrial(user.id, trialPackageIds(catalog)))
  ) {
    return {
      fieldErrors: [
        "Vous avez déjà profité d'un essai. Cette offre est réservée aux nouveaux comptes.",
      ],
    };
  }

  if (offer.kind === "mag") {
    if (!mac) return { fieldErrors: ["Renseignez l'adresse MAC de votre boîtier."] };
    if (!isMac(mac)) return { fieldErrors: ["Adresse MAC invalide (00:1A:79:XX:XX:XX)."] };
    mac = normalizeMac(mac);
  }

  // Nombre d'écrans choisi (lignes M3U uniquement).
  const included = offer.included_screens || 1;
  let screens = included;
  if (offer.kind === "line" && offer.allow_screens) {
    screens = Number(formData.get("screens")) || included;
    if (screens < included || screens > Math.min(5, offer.max_screens || 5)) {
      return { fieldErrors: ["Nombre d'écrans invalide."] };
    }
  }
  const priceCents = offerPriceCents(offer, screens);

  // Anti-abus : pas plus de 8 commandes sur la dernière heure.
  const recent = (await sql`
    SELECT COUNT(*)::int AS n FROM iptv_orders
    WHERE user_id = ${user.id} AND created_at > now() - interval '1 hour'
  `) as unknown as { n: number }[];
  if ((recent[0]?.n ?? 0) >= 8) {
    return { fieldErrors: ["Trop de commandes récentes. Réessayez plus tard."] };
  }

  // Une seule commande en attente (paiement ou traitement) par offre et par client.
  const existing = (await sql`
    SELECT 1 FROM iptv_orders
    WHERE user_id = ${user.id} AND offer_id = ${offerId}
      AND status IN ('awaiting_payment', 'pending')
  `) as unknown as unknown[];
  if (existing.length > 0) {
    return { fieldErrors: ["Vous avez déjà une commande en attente pour cette offre."] };
  }

  const rows = (await sql`
    INSERT INTO iptv_orders
      (user_id, offer_id, kind, title, price_cents, package_id, template_id,
       dns_domain_id, max_connections, is_adult, want_adult, want_french, mac,
       customer_note, status)
    VALUES
      (${user.id}, ${offer.id}, ${offer.kind}, ${offer.title}, ${priceCents},
       ${offer.goldenott_package_id}, ${offer.goldenott_template_id},
       ${offer.dns_domain_id}, ${screens}, ${offer.is_adult}, ${wantAdult},
       ${wantFrench}, ${offer.kind === "mag" ? mac : null}, ${customerNote},
       'awaiting_payment')
    RETURNING id
  `) as unknown as { id: number }[];
  const orderId = rows[0].id;

  let checkoutUrl: string;
  try {
    checkoutUrl = await createCheckoutSession({
      orderId,
      userEmail: user.email,
      title: offer.title,
      priceCents,
      cancelPath: `/commander/${offer.id}`,
    });
  } catch (err) {
    await sql`DELETE FROM iptv_orders WHERE id = ${orderId}`;
    return {
      fieldErrors: [
        err instanceof Error ? err.message : "Impossible de lancer le paiement.",
      ],
    };
  }

  revalidatePath("/profil");
  redirect(checkoutUrl);
}

/** Le client demande le renouvellement d'un abonnement GoldenOTT existant. */
export async function createRenewalOrderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  if (!stripeConfigured()) {
    return {
      fieldErrors: ["Le paiement par carte n'est pas configuré pour le moment."],
    };
  }

  const subId = Number(formData.get("sub_id")) || 0;
  const offerId = Number(formData.get("offer_id")) || 0;

  const sub = await subscriptionById(subId);
  if (!sub || sub.user_id !== user.id || sub.provider !== "goldenott") {
    return { fieldErrors: ["Abonnement introuvable."] };
  }
  const offer = await offerById(offerId);
  if (!offer || !offer.active || offer.kind !== sub.provider_kind) {
    return { fieldErrors: ["Choisissez une durée de renouvellement valide."] };
  }

  const existing = (await sql`
    SELECT 1 FROM iptv_orders
    WHERE user_id = ${user.id} AND renew_sub_id = ${subId}
      AND status IN ('awaiting_payment', 'pending')
  `) as unknown as unknown[];
  if (existing.length > 0) {
    return { fieldErrors: ["Une demande de renouvellement est déjà en attente."] };
  }

  const title = `Renouvellement — ${sub.label}`;
  const rows = (await sql`
    INSERT INTO iptv_orders
      (user_id, offer_id, kind, title, price_cents, package_id, template_id,
       dns_domain_id, max_connections, is_adult, renew_sub_id, customer_note, status)
    VALUES
      (${user.id}, ${offer.id}, ${offer.kind},
       ${title}, ${offer.price_cents},
       ${offer.goldenott_package_id}, ${offer.goldenott_template_id},
       ${offer.dns_domain_id}, ${sub.screens ?? offer.included_screens},
       ${offer.is_adult}, ${subId},
       ${str(formData.get("customer_note")).slice(0, 500)}, 'awaiting_payment')
    RETURNING id
  `) as unknown as { id: number }[];
  const orderId = rows[0].id;

  let checkoutUrl: string;
  try {
    checkoutUrl = await createCheckoutSession({
      orderId,
      userEmail: user.email,
      title,
      priceCents: offer.price_cents,
      cancelPath: "/profil",
    });
  } catch (err) {
    await sql`DELETE FROM iptv_orders WHERE id = ${orderId}`;
    return {
      fieldErrors: [
        err instanceof Error ? err.message : "Impossible de lancer le paiement.",
      ],
    };
  }

  revalidatePath("/profil");
  redirect(checkoutUrl);
}

/** Le client relance le paiement d'une commande restée sans paiement. */
export async function resumeOrderPaymentAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const orderId = Number(formData.get("order_id")) || 0;

  const order = await orderById(orderId);
  if (!order || order.user_id !== user.id || order.status !== "awaiting_payment") {
    redirect("/profil?onglet=commandes");
  }

  let checkoutUrl: string;
  try {
    checkoutUrl = await createCheckoutSession({
      orderId: order.id,
      userEmail: user.email,
      title: order.title,
      priceCents: order.price_cents,
      cancelPath: "/profil",
    });
  } catch {
    redirect("/profil?onglet=commandes");
  }

  redirect(checkoutUrl);
}

/**
 * Le client annule une commande. Réservé aux commandes non payées :
 * une fois le paiement Stripe confirmé (statut 'pending' ou 'fulfilled'),
 * une annulation doit passer par le support pour être remboursée.
 */
export async function cancelOrderAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const orderId = Number(formData.get("order_id")) || 0;
  await sql`
    UPDATE iptv_orders SET status = 'cancelled', decided_at = now()
    WHERE id = ${orderId} AND user_id = ${user.id} AND status = 'awaiting_payment'
  `;
  revalidatePath("/profil");
  revalidatePath("/admin/commandes");
  redirect("/profil");
}

/* ================================================================== */
/*  CÔTÉ ADMIN                                                          */
/* ================================================================== */

/** L'admin valide une commande → provisioning GoldenOTT. */
export async function approveOrderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireAdmin();
  const orderId = Number(formData.get("order_id")) || 0;

  const order = await orderById(orderId);
  if (!order) return { fieldErrors: ["Commande introuvable."] };
  if (order.status !== "pending") {
    return { fieldErrors: ["Cette commande a déjà été traitée."] };
  }

  /* ----- Renouvellement d'un abonnement existant ----- */
  if (order.renew_sub_id) {
    const sub = await subscriptionById(order.renew_sub_id);
    if (!sub) return { fieldErrors: ["Abonnement à renouveler introuvable."] };
    try {
      await extendSubscriptionLocal(sub, order.package_id, me.email, order.title);
    } catch (err) {
      return { fieldErrors: errMessages(err) };
    }
    await sql`
      UPDATE iptv_orders
      SET status = 'fulfilled', subscription_id = ${sub.id},
          admin_note = ${str(formData.get("admin_note"))}, decided_at = now()
      WHERE id = ${orderId}
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
    revalidatePath("/admin/commandes");
    revalidatePath("/admin");
    redirect("/admin/commandes?ok=1");
  }

  /* ----- Nouvel abonnement ----- */
  const label = str(formData.get("label")) || order.title;
  const creds = prepareLineCredentials(
    str(formData.get("username")),
    String(formData.get("password") ?? ""),
  );
  if (order.kind === "line") {
    const credErrors = validateLineCredentials(creds.username, creds.password);
    if (credErrors.length > 0) return { fieldErrors: credErrors };
  }

  // Un forfait d'essai (24 h) donne un abonnement jetable, purgé à l'expiration.
  const catalog = await loadGoldenottCatalog();
  const isTrial = Boolean(
    catalog.packages.find((p) => p.id === order.package_id)?.isTrial,
  );

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
      label,
      note: order.customer_note,
      actor: me.email,
      username: order.kind === "line" ? creds.username : undefined,
      password: order.kind === "line" ? creds.password : undefined,
      maxConnections: order.max_connections,
      mac: order.kind === "mag" ? order.mac ?? undefined : undefined,
      orderId,
    });
  } catch (err) {
    return { fieldErrors: errMessages(err) };
  }

  if (str(formData.get("admin_note"))) {
    await sql`
      UPDATE iptv_orders SET admin_note = ${str(formData.get("admin_note"))}
      WHERE id = ${orderId}
    `;
  }

  await sendOrderAcceptedEmail({
    customerName: order.user_name,
    customerEmail: order.user_email,
    title: order.title,
    priceCents: order.price_cents,
    kind: order.kind,
    screens: order.max_connections,
    isRenewal: false,
    subscriptionLabel: label,
  });

  revalidatePath("/admin/commandes");
  revalidatePath("/admin");
  redirect("/admin/commandes?ok=1");
}

export async function rejectOrderAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const orderId = Number(formData.get("order_id")) || 0;
  const adminNote = str(formData.get("admin_note")).slice(0, 500);

  const order = await orderById(orderId);
  // Refus = notification par e-mail puis suppression : on ne garde aucun
  // historique de commande refusée.
  const rows = (await sql`
    DELETE FROM iptv_orders
    WHERE id = ${orderId} AND status = 'pending'
    RETURNING id
  `) as unknown as { id: number }[];

  if (rows.length > 0 && order) {
    // Une commande 'pending' est désormais toujours une commande déjà payée
    // par carte (le paiement est confirmé avant provisioning) : la refuser
    // doit rembourser le client automatiquement.
    const hadPayment = Boolean(order.stripe_payment_intent_id);
    if (hadPayment) {
      try {
        await stripe().refunds.create({
          payment_intent: order.stripe_payment_intent_id!,
        });
      } catch (err) {
        console.error(
          `[order-actions] remboursement Stripe échoué pour la commande #${orderId}`,
          err,
        );
      }
    }

    await sendOrderRejectedEmail({
      customerName: order.user_name,
      customerEmail: order.user_email,
      title: order.title,
      priceCents: order.price_cents,
      kind: order.kind,
      screens: order.max_connections,
      isRenewal: Boolean(order.renew_sub_id),
      reason: adminNote,
      refunded: hadPayment,
    });
  }

  revalidatePath("/admin/commandes");
  revalidatePath("/admin");
  redirect("/admin/commandes?ok=1");
}

