import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sql } from "@/lib/db";
import { fulfillPaidOrder } from "@/lib/order-fulfillment";
import { stripe } from "@/lib/stripe";

/**
 * Webhook Stripe : confirme un paiement Checkout et déclenche le
 * provisioning automatique de la commande correspondante.
 *
 * À configurer dans le tableau de bord Stripe (Developers > Webhooks) sur
 * `https://<domaine>/api/stripe/webhook`, événement `checkout.session.completed`.
 * Le secret de signature va dans STRIPE_WEBHOOK_SECRET.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) {
    return NextResponse.json({ error: "webhook non configuré" }, { status: 503 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[stripe-webhook] signature invalide", err);
    return NextResponse.json({ error: "signature invalide" }, { status: 400 });
  }

  // Déduplication : Stripe peut renvoyer le même événement plusieurs fois.
  try {
    await sql`INSERT INTO stripe_webhook_events (id) VALUES (${event.id})`;
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = Number(session.metadata?.order_id) || 0;

    if (orderId && session.payment_status === "paid") {
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      await sql`
        UPDATE iptv_orders
        SET paid_at = now(), stripe_payment_intent_id = ${paymentIntentId}
        WHERE id = ${orderId} AND status = 'awaiting_payment'
      `;

      try {
        await fulfillPaidOrder(orderId);
      } catch (err) {
        // Le paiement est confirmé quoi qu'il arrive ; une erreur ici ne
        // doit jamais faire échouer l'accusé de réception à Stripe (sinon
        // il retenterait indéfiniment). L'admin peut toujours provisionner
        // à la main depuis /admin/commandes.
        console.error(`[stripe-webhook] fulfillPaidOrder(${orderId}) a échoué`, err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
