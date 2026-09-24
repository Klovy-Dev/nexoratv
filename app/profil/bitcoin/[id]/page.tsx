import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { requireUser } from "@/lib/auth";
import { orderById } from "@/lib/data";
import {
  bitcoinAddress,
  bitcoinUri,
  BTC_MIN_CONFIRMATIONS,
  BTC_QUOTE_MINUTES,
  checkBitcoinOrder,
  mempoolTxUrl,
  quoteBitcoinOrder,
  quoteExpired,
  satsToBtc,
  type BitcoinPaymentState,
} from "@/lib/bitcoin";
import { formatPrice } from "@/lib/validation";
import BitcoinPayment from "./BitcoinPayment";

export const metadata: Metadata = { title: "Paiement Bitcoin" };
export const dynamic = "force-dynamic";

export default async function BitcoinPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const id = Number((await params).id) || 0;

  let order = await orderById(id);
  if (!order || order.user_id !== user.id || order.payment_provider !== "bitcoin") {
    redirect("/profil?onglet=commandes");
  }
  if (order.status !== "awaiting_payment") redirect("/profil?commande=1");

  const chargeCents = order.price_cents - order.credit_applied_cents;

  let state: BitcoinPaymentState = { state: "waiting" };
  let apiError = false;
  try {
    state = await checkBitcoinOrder(order);
    // Montant expiré et aucun paiement repéré : nouveau cours.
    if (state.state === "waiting" && quoteExpired(order)) {
      await quoteBitcoinOrder(order.id, chargeCents);
      order = (await orderById(id)) ?? order;
    }
  } catch {
    apiError = true;
  }
  if (state.state === "paid") redirect("/profil?commande=1");

  const sats = Number(order.btc_amount_sats ?? 0);
  if (!sats) {
    return (
      <section className="order-step">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="panel">
            <h1>Paiement Bitcoin</h1>
            <div className="flash flash-error">
              Le cours du Bitcoin est momentanément indisponible. Réessayez
              dans quelques minutes.
            </div>
            <Link href="/profil?onglet=commandes" className="btn btn-ghost">
              ← Mes commandes
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const uri = bitcoinUri(sats);
  const qrSvg = await QRCode.toString(uri, { type: "svg", margin: 1, width: 220 });
  const expiresAt = order.btc_quoted_at
    ? new Date(new Date(order.btc_quoted_at).getTime() + BTC_QUOTE_MINUTES * 60_000).toISOString()
    : null;

  return (
    <section className="order-step">
      <div className="container" style={{ maxWidth: 640 }}>
        <Link href="/profil?onglet=commandes" className="order-back">
          ← Mes commandes
        </Link>
        <div className="panel">
          <h1 style={{ marginBottom: 6 }}>Paiement en Bitcoin</h1>
          <p className="muted" style={{ marginBottom: 20 }}>
            {order.title} · {formatPrice(chargeCents)}
          </p>

          {apiError && (
            <div className="flash flash-error" style={{ marginBottom: 16 }}>
              Vérification de la blockchain momentanément indisponible — votre
              paiement sera détecté dès le retour du service.
            </div>
          )}

          <BitcoinPayment
            key={state.state}
            orderId={order.id}
            address={bitcoinAddress()}
            btc={satsToBtc(sats)}
            uri={uri}
            qrSvg={qrSvg}
            expiresAt={expiresAt}
            rateEur={order.btc_rate_eur}
            minConfirmations={BTC_MIN_CONFIRMATIONS}
            initial={
              state.state === "seen"
                ? { state: "seen", confirmations: state.confirmations, txUrl: mempoolTxUrl(state.txid) }
                : { state: "waiting" }
            }
          />
        </div>
      </div>
    </section>
  );
}
