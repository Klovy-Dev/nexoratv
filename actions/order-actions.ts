"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clientIp, requireAdmin, requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import {
  grantReferralReward,
  hasUsedTrial,
  markTrialUsedByIp,
  offerById,
  orderById,
  releaseReferralCredit,
  reserveReferralCredit,
  subscriptionById,
  trialBlockedForIp,
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
  resolveProvisioningOptions,
  validateLineCredentials,
} from "@/lib/goldenott-provision";
import { appOrigin } from "@/lib/mail";
import { errMessages, fulfillPaidOrder } from "@/lib/order-fulfillment";
import { createPaypalOrder, paypalConfigured, refundPaypalCapture } from "@/lib/paypal";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { isMac, normalizeMac, str } from "@/lib/validation";
import { sendOrderAcceptedEmail, sendOrderRejectedEmail } from "@/lib/order-mail";
import { offerPriceCents, type FormState, type PaymentProvider } from "@/lib/types";

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

/**
 * Ouvre une commande PayPal (Orders v2) pour une commande déjà enregistrée
 * et enregistre son identifiant. Renvoie le lien d'approbation PayPal vers
 * lequel rediriger le client.
 */
async function createPaypalCheckout(opts: {
  orderId: number;
  title: string;
  priceCents: number;
  cancelPath: string;
}): Promise<string> {
  const site = await appOrigin();
  const created = await createPaypalOrder({
    amountCents: opts.priceCents,
    description: opts.title,
    customId: String(opts.orderId),
    returnUrl: `${site}/api/paypal/return?order_id=${opts.orderId}`,
    cancelUrl: `${site}${opts.cancelPath}?annule=1`,
  });

  await sql`
    UPDATE iptv_orders SET paypal_order_id = ${created.id} WHERE id = ${opts.orderId}
  `;

  return created.approveUrl;
}

/** Choisit et vérifie le moyen de paiement soumis par le client. */
function pickPaymentMethod(formData: FormData): PaymentProvider | null {
  const method = str(formData.get("payment_method")) === "paypal" ? "paypal" : "stripe";
  if (method === "stripe" && !stripeConfigured()) return null;
  if (method === "paypal" && !paypalConfigured()) return null;
  return method;
}

async function openCheckout(
  method: PaymentProvider,
  opts: { orderId: number; userEmail: string; title: string; priceCents: number; cancelPath: string },
): Promise<string> {
  return method === "paypal" ? createPaypalCheckout(opts) : createCheckoutSession(opts);
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

  const paymentMethod = pickPaymentMethod(formData);
  if (!paymentMethod) {
    return {
      fieldErrors: ["Ce moyen de paiement n'est pas configuré pour le moment."],
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
  const isTrial = isTrialPackage(catalog, offer.goldenott_package_id);
  if (isTrial && (await hasUsedTrial(user.id, trialPackageIds(catalog)))) {
    return {
      fieldErrors: [
        "Vous avez déjà profité d'un essai. Cette offre est réservée aux nouveaux comptes.",
      ],
    };
  }

  // Anti-abus : un essai gratuit déjà honoré depuis cette IP bloque les
  // comptes suivants créés uniquement pour en rejouer un (blocage
  // définitif, indépendant du compte utilisé).
  if (isTrial && offerPriceCents(offer, offer.included_screens || 1) === 0) {
    const ip = await clientIp();
    if (await trialBlockedForIp(ip)) {
      return {
        fieldErrors: [
          "Cet essai gratuit a déjà été utilisé depuis votre connexion. Vous pouvez commander une offre payante normalement.",
        ],
      };
    }
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

  // Crédit de parrainage disponible : réservé tout de suite (restitué si la
  // commande est annulée / refusée / abandonnée), déduit du montant Stripe.
  const creditApplied = await reserveReferralCredit(user.id, priceCents);
  const chargeCents = priceCents - creditApplied;

  const rows = (await sql`
    INSERT INTO iptv_orders
      (user_id, offer_id, kind, title, price_cents, package_id, template_id,
       dns_domain_id, max_connections, is_adult, want_adult, want_french, mac,
       customer_note, status, credit_applied_cents, payment_provider)
    VALUES
      (${user.id}, ${offer.id}, ${offer.kind}, ${offer.title}, ${priceCents},
       ${offer.goldenott_package_id}, ${offer.goldenott_template_id},
       ${offer.dns_domain_id}, ${screens}, ${offer.is_adult}, ${wantAdult},
       ${wantFrench}, ${offer.kind === "mag" ? mac : null}, ${customerNote},
       'awaiting_payment', ${creditApplied}, ${paymentMethod})
    RETURNING id
  `) as unknown as { id: number }[];
  const orderId = rows[0].id;

  // Offre à 0 € (ex. essai gratuit) : rien à payer, donc rien à envoyer au
  // fournisseur de paiement. Stripe accepte un Checkout Session à 0 € (il
  // finalise sans demander de carte), mais PayPal refuse catégoriquement
  // les commandes à 0,00 € — on court-circuite donc les deux dans ce cas et
  // on valide directement, quel que soit le moyen de paiement choisi.
  if (chargeCents <= 0) {
    await fulfillPaidOrder(orderId);
    if (isTrial) {
      await markTrialUsedByIp(await clientIp(), orderId);
    }
    revalidatePath("/profil");
    redirect("/profil?commande=1");
  }

  let checkoutUrl: string;
  try {
    checkoutUrl = await openCheckout(paymentMethod, {
      orderId,
      userEmail: user.email,
      title: offer.title,
      priceCents: chargeCents,
      cancelPath: `/commander/${offer.id}`,
    });
  } catch (err) {
    await sql`DELETE FROM iptv_orders WHERE id = ${orderId}`;
    await releaseReferralCredit(user.id, creditApplied);
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

  const paymentMethod = pickPaymentMethod(formData);
  if (!paymentMethod) {
    return {
      fieldErrors: ["Ce moyen de paiement n'est pas configuré pour le moment."],
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
  const creditApplied = await reserveReferralCredit(user.id, offer.price_cents);
  const chargeCents = offer.price_cents - creditApplied;

  const rows = (await sql`
    INSERT INTO iptv_orders
      (user_id, offer_id, kind, title, price_cents, package_id, template_id,
       dns_domain_id, max_connections, is_adult, renew_sub_id, customer_note, status,
       credit_applied_cents, payment_provider)
    VALUES
      (${user.id}, ${offer.id}, ${offer.kind},
       ${title}, ${offer.price_cents},
       ${offer.goldenott_package_id}, ${offer.goldenott_template_id},
       ${offer.dns_domain_id}, ${sub.screens ?? offer.included_screens},
       ${offer.is_adult}, ${subId},
       ${str(formData.get("customer_note")).slice(0, 500)}, 'awaiting_payment',
       ${creditApplied}, ${paymentMethod})
    RETURNING id
  `) as unknown as { id: number }[];
  const orderId = rows[0].id;

  // Cf. createOrderAction : rien à payer, on ne sollicite aucun fournisseur.
  if (chargeCents <= 0) {
    await fulfillPaidOrder(orderId);
    revalidatePath("/profil");
    redirect("/profil?commande=1");
  }

  let checkoutUrl: string;
  try {
    checkoutUrl = await openCheckout(paymentMethod, {
      orderId,
      userEmail: user.email,
      title,
      priceCents: chargeCents,
      cancelPath: "/profil",
    });
  } catch (err) {
    await sql`DELETE FROM iptv_orders WHERE id = ${orderId}`;
    await releaseReferralCredit(user.id, creditApplied);
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
    checkoutUrl = await openCheckout(order.payment_provider, {
      orderId: order.id,
      userEmail: user.email,
      title: order.title,
      priceCents: order.price_cents - order.credit_applied_cents,
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
  const rows = (await sql`
    UPDATE iptv_orders SET status = 'cancelled', decided_at = now()
    WHERE id = ${orderId} AND user_id = ${user.id} AND status = 'awaiting_payment'
    RETURNING credit_applied_cents
  `) as unknown as { credit_applied_cents: number }[];
  if (rows[0]?.credit_applied_cents) {
    await releaseReferralCredit(user.id, rows[0].credit_applied_cents);
  }
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

  const { isAdult, templateId } = resolveProvisioningOptions(order, catalog);

  try {
    await provisionSubscription({
      userId: order.user_id,
      kind: order.kind,
      packageId: order.package_id,
      packageLabel: order.title,
      templateId,
      dnsDomainId: order.dns_domain_id,
      isAdult,
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

  try {
    await grantReferralReward(order);
  } catch (err) {
    console.error("[order-actions] récompense de parrainage échouée :", err);
  }

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
    if (order.credit_applied_cents) {
      await releaseReferralCredit(order.user_id, order.credit_applied_cents);
    }
    const hadPayment =
      order.payment_provider === "paypal"
        ? Boolean(order.paypal_capture_id)
        : Boolean(order.stripe_payment_intent_id);
    if (hadPayment) {
      try {
        if (order.payment_provider === "paypal") {
          await refundPaypalCapture(order.paypal_capture_id!);
        } else {
          await stripe().refunds.create({
            payment_intent: order.stripe_payment_intent_id!,
          });
        }
      } catch (err) {
        console.error(
          `[order-actions] remboursement ${order.payment_provider} échoué pour la commande #${orderId}`,
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

