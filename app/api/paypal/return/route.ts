import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { orderById } from "@/lib/data";
import { appOrigin } from "@/lib/mail";
import { fulfillPaidOrder } from "@/lib/order-fulfillment";
import { ensureCaptured } from "@/lib/paypal";

/**
 * Retour du client depuis PayPal après approbation du paiement
 * (`application_context.return_url`). Capture effectivement les fonds puis
 * déclenche l'activation automatique.
 *
 * Filet de sécurité : `/api/paypal/webhook` (événement
 * CHECKOUT.ORDER.APPROVED) fait le même travail si ce retour n'a jamais
 * lieu — navigateur fermé côté PayPal juste après l'approbation.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const orderId = Number(url.searchParams.get("order_id")) || 0;
  const token = url.searchParams.get("token");

  const site = await appOrigin();
  const order = orderId ? await orderById(orderId) : null;

  if (!order || order.payment_provider !== "paypal" || order.paypal_order_id !== token) {
    return NextResponse.redirect(`${site}/profil?onglet=commandes`);
  }

  if (order.status === "awaiting_payment") {
    try {
      const capture = await ensureCaptured(order.paypal_order_id!);
      if (capture.status === "COMPLETED" && capture.captureId) {
        await sql`
          UPDATE iptv_orders
          SET paid_at = now(), paypal_capture_id = ${capture.captureId}
          WHERE id = ${order.id} AND status = 'awaiting_payment'
        `;
        await fulfillPaidOrder(order.id);
      }
    } catch (err) {
      // Le webhook prendra le relais ; l'admin peut aussi provisionner à la
      // main depuis /admin/commandes une fois le paiement confirmé.
      console.error(`[paypal-return] capture échouée pour la commande #${order.id}`, err);
    }
  }

  return NextResponse.redirect(`${site}/profil?commande=1`);
}
