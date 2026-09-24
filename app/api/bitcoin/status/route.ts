import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { orderById } from "@/lib/data";
import { checkBitcoinOrder, mempoolTxUrl, quoteExpired } from "@/lib/bitcoin";

/**
 * État du paiement d'une commande Bitcoin, interrogé toutes les 20 s par la
 * page /profil/bitcoin/[id]. Vérifie la blockchain et active la commande
 * dès que le paiement est confirmé.
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = Number(new URL(req.url).searchParams.get("order")) || 0;
  const order = await orderById(id);
  if (!order || order.user_id !== user.id || order.payment_provider !== "bitcoin") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (order.status !== "awaiting_payment") {
    return NextResponse.json({ state: "closed" });
  }

  try {
    const s = await checkBitcoinOrder(order);
    if (s.state === "seen") {
      return NextResponse.json({
        state: "seen",
        confirmations: s.confirmations,
        txUrl: mempoolTxUrl(s.txid),
      });
    }
    return NextResponse.json({
      state: s.state,
      expired: s.state === "waiting" && quoteExpired(order),
    });
  } catch {
    return NextResponse.json({ error: "blockchain indisponible" }, { status: 502 });
  }
}
