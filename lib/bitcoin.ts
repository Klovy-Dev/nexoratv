import "server-only";
import { sql } from "@/lib/db";
import { fulfillPaidOrder } from "@/lib/order-fulfillment";
import type { Order } from "@/lib/types";

/**
 * Paiement Bitcoin on-chain, directement sur le portefeuille NexoraTV
 * (aucun intermédiaire, aucune clé privée côté serveur : seule l'adresse
 * publique de réception est connue ici).
 *
 * Principe :
 *  - à la commande, le prix en euros est converti en un montant EXACT en
 *    satoshis, unique parmi les commandes Bitcoin ouvertes. Toutes les
 *    commandes partagent la même adresse : c'est ce montant qui permet de
 *    rattacher une transaction à sa commande ;
 *  - la blockchain est lue via l'API publique mempool.space ;
 *  - une transaction vue en mempool est retenue sur la commande (`btc_txid`),
 *    la commande est payée après BTC_MIN_CONFIRMATIONS confirmation(s) ;
 *  - si le client a envoyé un montant légèrement différent (frais retenus
 *    par une plateforme d'échange…), il peut déclarer son identifiant de
 *    transaction, accepté s'il couvre au moins 99 % du montant attendu.
 *
 * Configuration (facultative) :
 *   BITCOIN_ADDRESS   adresse de réception (sinon adresse par défaut)
 *   BITCOIN_DISABLED  "1" pour masquer le moyen de paiement
 *   MEMPOOL_API_URL   autre instance mempool (défaut https://mempool.space/api)
 */

const DEFAULT_ADDRESS = "bc1q580yq6723gdperp55gd2rrzqmmzfea7rvwx0ua";

/** Durée pendant laquelle le montant en BTC est garanti au client. */
export const BTC_QUOTE_MINUTES = 60;

/** Confirmations requises avant d'activer l'abonnement. */
export const BTC_MIN_CONFIRMATIONS = 1;

/** Part minimale du montant attendu acceptée sur un txid déclaré. */
const TXID_MIN_RATIO = 0.99;

function api(): string {
  return (process.env.MEMPOOL_API_URL ?? "https://mempool.space/api").replace(/\/+$/, "");
}

export function bitcoinAddress(): string {
  return (process.env.BITCOIN_ADDRESS || DEFAULT_ADDRESS).trim();
}

export function bitcoinConfigured(): boolean {
  return process.env.BITCOIN_DISABLED !== "1" && /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,87}$/.test(bitcoinAddress());
}

export function satsToBtc(sats: number): string {
  return (sats / 1e8).toFixed(8);
}

/** URI BIP21, lue par les portefeuilles (QR code, lien cliquable). */
export function bitcoinUri(sats: number): string {
  return `bitcoin:${bitcoinAddress()}?amount=${satsToBtc(sats)}&label=NexoraTV`;
}

export function mempoolTxUrl(txid: string): string {
  return `https://mempool.space/tx/${txid}`;
}

export function mempoolAddressUrl(): string {
  return `https://mempool.space/address/${bitcoinAddress()}`;
}

export function quoteExpired(order: Pick<Order, "btc_quoted_at">): boolean {
  if (!order.btc_quoted_at) return true;
  return Date.now() - new Date(order.btc_quoted_at).getTime() > BTC_QUOTE_MINUTES * 60_000;
}

/* ------------------------------------------------------------------ */
/*  API mempool.space                                                  */
/* ------------------------------------------------------------------ */

interface MempoolTx {
  txid: string;
  status: { confirmed: boolean; block_height?: number; block_time?: number };
  vout: { scriptpubkey_address?: string; value: number }[];
}

async function get(path: string): Promise<Response> {
  return fetch(`${api()}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
}

async function getJson<T>(path: string): Promise<T> {
  const res = await get(path);
  if (!res.ok) throw new Error(`mempool.space a répondu ${res.status} sur ${path}`);
  return (await res.json()) as T;
}

/** Cours BTC en euros (entier). */
async function eurRate(): Promise<number> {
  const prices = await getJson<{ EUR?: number }>("/v1/prices");
  const eur = Number(prices.EUR);
  if (!Number.isFinite(eur) || eur < 1000) {
    throw new Error("Cours du Bitcoin indisponible pour le moment.");
  }
  return Math.round(eur);
}

async function tipHeight(): Promise<number> {
  const res = await get("/blocks/tip/height");
  if (!res.ok) throw new Error(`mempool.space a répondu ${res.status} (hauteur)`);
  return Number(await res.text());
}

/** Transactions récentes de l'adresse (mempool + 25 dernières confirmées). */
async function addressTxs(): Promise<MempoolTx[]> {
  return getJson<MempoolTx[]>(`/address/${bitcoinAddress()}/txs`);
}

/** Une transaction précise, ou null si inconnue (jamais diffusée / évincée). */
async function txById(txid: string): Promise<MempoolTx | null> {
  const res = await get(`/tx/${txid}`);
  if (res.status === 400 || res.status === 404) return null;
  if (!res.ok) throw new Error(`mempool.space a répondu ${res.status} (tx)`);
  return (await res.json()) as MempoolTx;
}

function paidToAddress(tx: MempoolTx): number {
  const addr = bitcoinAddress();
  return tx.vout
    .filter((o) => o.scriptpubkey_address === addr)
    .reduce((sum, o) => sum + o.value, 0);
}

function confirmations(tx: MempoolTx, tip: number): number {
  if (!tx.status.confirmed || !tx.status.block_height) return 0;
  return tip - tx.status.block_height + 1;
}

/** Une transaction confirmée avant la commande ne peut pas la payer. */
function minedBeforeOrder(tx: MempoolTx, order: Order): boolean {
  if (!tx.status.confirmed || !tx.status.block_time) return false;
  return tx.status.block_time * 1000 < new Date(order.created_at).getTime() - 10 * 60_000;
}

/* ------------------------------------------------------------------ */
/*  Montant                                                            */
/* ------------------------------------------------------------------ */

/**
 * Fixe (ou refixe) le montant en satoshis d'une commande Bitcoin au cours
 * du moment. Le montant est décalé d'1 sat tant qu'il est déjà attendu par
 * une autre commande ouverte.
 */
export async function quoteBitcoinOrder(orderId: number, chargeCents: number): Promise<void> {
  const rate = await eurRate();
  const base = Math.ceil((chargeCents * 1e6) / rate);

  const taken = new Set(
    (
      (await sql`
        SELECT btc_amount_sats FROM iptv_orders
        WHERE payment_provider = 'bitcoin' AND status = 'awaiting_payment'
          AND id <> ${orderId} AND btc_amount_sats IS NOT NULL
      `) as unknown as { btc_amount_sats: number }[]
    ).map((r) => Number(r.btc_amount_sats)),
  );
  let sats = base;
  while (taken.has(sats)) sats++;

  await sql`
    UPDATE iptv_orders
    SET btc_amount_sats = ${sats}, btc_rate_eur = ${rate}, btc_quoted_at = now()
    WHERE id = ${orderId} AND status = 'awaiting_payment' AND btc_txid IS NULL
  `;
}

/* ------------------------------------------------------------------ */
/*  Détection du paiement                                              */
/* ------------------------------------------------------------------ */

export type BitcoinPaymentState =
  | { state: "waiting" }
  | { state: "seen"; txid: string; confirmations: number }
  | { state: "paid" };

async function markPaid(orderId: number): Promise<void> {
  await sql`
    UPDATE iptv_orders SET paid_at = COALESCE(paid_at, now())
    WHERE id = ${orderId} AND status = 'awaiting_payment'
  `;
  await fulfillPaidOrder(orderId);
}

/** Retient `txid` sur la commande. false si déjà rattachée ailleurs. */
async function attachTxid(orderId: number, txid: string): Promise<boolean> {
  try {
    const rows = await sql`
      UPDATE iptv_orders SET btc_txid = ${txid}
      WHERE id = ${orderId} AND status = 'awaiting_payment'
        AND (btc_txid IS NULL OR btc_txid = ${txid})
      RETURNING id
    `;
    return rows.length > 0;
  } catch {
    return false; // index unique : transaction déjà utilisée par une autre commande
  }
}

async function settle(order: Order, tx: MempoolTx, tip: number): Promise<BitcoinPaymentState> {
  const conf = confirmations(tx, tip);
  if (conf >= BTC_MIN_CONFIRMATIONS) {
    await markPaid(order.id);
    return { state: "paid" };
  }
  return { state: "seen", txid: tx.txid, confirmations: conf };
}

/**
 * Vérifie sur la blockchain si une commande Bitcoin a été payée, et
 * l'active si c'est le cas. `ctx` permet de partager les appels API
 * entre plusieurs commandes (balayage).
 */
export async function checkBitcoinOrder(
  order: Order,
  ctx?: { txs: MempoolTx[]; tip: number },
): Promise<BitcoinPaymentState> {
  if (order.status === "pending" || order.status === "fulfilled") return { state: "paid" };
  if (order.status !== "awaiting_payment" || order.payment_provider !== "bitcoin") {
    return { state: "waiting" };
  }

  const tip = ctx?.tip ?? (await tipHeight());

  // Transaction déjà repérée : on suit ses confirmations.
  if (order.btc_txid) {
    const tx = ctx?.txs.find((t) => t.txid === order.btc_txid) ?? (await txById(order.btc_txid));
    if (!tx) {
      // Évincée du mempool (remplacée / double dépense) : on la relâche.
      await sql`
        UPDATE iptv_orders SET btc_txid = NULL
        WHERE id = ${order.id} AND status = 'awaiting_payment'
      `;
      return { state: "waiting" };
    }
    return settle(order, tx, tip);
  }

  if (!order.btc_amount_sats) return { state: "waiting" };
  const expected = Number(order.btc_amount_sats);
  const txs = ctx?.txs ?? (await addressTxs());
  for (const tx of txs) {
    if (paidToAddress(tx) !== expected || minedBeforeOrder(tx, order)) continue;
    if (!(await attachTxid(order.id, tx.txid))) continue;
    return settle(order, tx, tip);
  }
  return { state: "waiting" };
}

/**
 * Le client déclare l'identifiant de sa transaction (montant envoyé
 * différent du montant exact demandé).
 */
export async function claimBitcoinTxid(
  order: Order,
  rawTxid: string,
): Promise<BitcoinPaymentState | { state: "error"; message: string }> {
  const txid = rawTxid.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(txid)) {
    return { state: "error", message: "Identifiant de transaction invalide (64 caractères hexadécimaux)." };
  }
  if (order.btc_txid && order.btc_txid !== txid) {
    return { state: "error", message: "Une autre transaction est déjà rattachée à cette commande." };
  }

  const tx = await txById(txid);
  if (!tx) {
    return { state: "error", message: "Transaction introuvable sur la blockchain. Réessayez dans quelques minutes." };
  }
  const paid = paidToAddress(tx);
  if (paid === 0) {
    return { state: "error", message: "Cette transaction n'envoie rien à l'adresse NexoraTV." };
  }
  if (minedBeforeOrder(tx, order)) {
    return { state: "error", message: "Cette transaction est antérieure à la commande." };
  }
  const expected = Number(order.btc_amount_sats ?? 0);
  if (paid < Math.ceil(expected * TXID_MIN_RATIO)) {
    return {
      state: "error",
      message: `Montant insuffisant : ${satsToBtc(paid)} BTC reçus pour ${satsToBtc(expected)} BTC attendus. Contactez-nous pour régulariser.`,
    };
  }
  if (!(await attachTxid(order.id, txid))) {
    return { state: "error", message: "Cette transaction est déjà rattachée à une autre commande." };
  }
  return settle(order, tx, await tipHeight());
}

/**
 * Passe en revue les commandes Bitcoin en attente (toutes, ou celles d'un
 * client) et active celles qui sont payées. Ne lève jamais d'erreur.
 */
export async function sweepBitcoinOrders(userId?: number): Promise<number> {
  try {
    const orders = (userId
      ? await sql`
          SELECT * FROM iptv_orders
          WHERE payment_provider = 'bitcoin' AND status = 'awaiting_payment'
            AND user_id = ${userId}
        `
      : await sql`
          SELECT * FROM iptv_orders
          WHERE payment_provider = 'bitcoin' AND status = 'awaiting_payment'
        `) as unknown as Order[];
    if (orders.length === 0) return 0;

    const [txs, tip] = await Promise.all([addressTxs(), tipHeight()]);
    let paid = 0;
    for (const order of orders) {
      try {
        if ((await checkBitcoinOrder(order, { txs, tip })).state === "paid") paid++;
      } catch (err) {
        console.error(`[bitcoin] vérification commande #${order.id}`, err);
      }
    }
    return paid;
  } catch (err) {
    console.error("[bitcoin] balayage des commandes", err);
    return 0;
  }
}
