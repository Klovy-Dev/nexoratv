import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { fulfillPaidOrder } from "@/lib/order-fulfillment";
import { ensureCaptured, verifyPaypalWebhook } from "@/lib/paypal";

/**
 * Webhook PayPal : filet de sécurité si `/api/paypal/return` n'a jamais eu
 * lieu (le client ferme son navigateur juste après avoir approuvé le
 * paiement côté PayPal, avant la redirection).
 *
 * À configurer dans le tableau de bord développeur PayPal (Apps & Credentials
 * > votre app > Webhooks) sur `https://<domaine>/api/paypal/webhook`,
 * événement `CHECKOUT.ORDER.APPROVED`. L'identifiant du webhook va dans
 * PAYPAL_WEBHOOK_ID (nécessaire pour vérifier la signature).
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface PaypalEvent {
  id: string;
  event_type: string;
  resource?: { id?: string };
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  let event: PaypalEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "corps invalide" }, { status: 400 });
  }

  let verified = false;
  try {
    verified = await verifyPaypalWebhook({ headers: req.headers, event });
  } catch (err) {
    console.error("[paypal-webhook] vérification de signature échouée", err);
  }
  if (!verified) {
    return NextResponse.json({ error: "signature invalide" }, { status: 400 });
  }

  // Déduplication : PayPal peut renvoyer le même événement plusieurs fois.
  try {
    await sql`INSERT INTO paypal_webhook_events (id) VALUES (${event.id})`;
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (event.event_type === "CHECKOUT.ORDER.APPROVED" && event.resource?.id) {
    const paypalOrderId = event.resource.id;
    try {
      const rows = (await sql`
        SELECT id FROM iptv_orders
        WHERE paypal_order_id = ${paypalOrderId} AND status = 'awaiting_payment'
      `) as unknown as { id: number }[];
      const orderId = rows[0]?.id;

      if (orderId) {
        const capture = await ensureCaptured(paypalOrderId);
        if (capture.status === "COMPLETED" && capture.captureId) {
          await sql`
            UPDATE iptv_orders
            SET paid_at = now(), paypal_capture_id = ${capture.captureId}
            WHERE id = ${orderId} AND status = 'awaiting_payment'
          `;
          await fulfillPaidOrder(orderId);
        }
      }
    } catch (err) {
      // Le paiement PayPal reste confirmé quoi qu'il arrive ; une erreur ici
      // ne doit jamais faire échouer l'accusé de réception (sinon PayPal
      // retenterait indéfiniment). L'admin peut provisionner à la main.
      console.error(
        `[paypal-webhook] traitement échoué pour la commande PayPal ${paypalOrderId}`,
        err,
      );
    }
  }

  return NextResponse.json({ received: true });
}
