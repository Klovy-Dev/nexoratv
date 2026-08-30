"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { offerById, orderById, subscriptionById } from "@/lib/data";
import { randomCredential } from "@/lib/crypto";
import { GoldenottError } from "@/lib/goldenott";
import {
  extendSubscriptionLocal,
  provisionSubscription,
} from "@/lib/goldenott-provision";
import { isMac, normalizeMac, str } from "@/lib/validation";
import type { FormState } from "@/lib/types";

function errMessages(err: unknown): string[] {
  if (err instanceof GoldenottError) return err.allMessages;
  if (err instanceof Error) return [err.message];
  return ["Erreur inattendue."];
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

  const offerId = Number(formData.get("offer_id")) || 0;
  const customerNote = str(formData.get("customer_note")).slice(0, 500);
  let mac = str(formData.get("mac"));

  const offer = await offerById(offerId);
  if (!offer || !offer.active) {
    return { fieldErrors: ["Cette offre n'est plus disponible."] };
  }

  if (offer.kind === "mag") {
    if (!mac) return { fieldErrors: ["Renseignez l'adresse MAC de votre boîtier."] };
    if (!isMac(mac)) return { fieldErrors: ["Adresse MAC invalide (00:1A:79:XX:XX:XX)."] };
    mac = normalizeMac(mac);
  }

  // Une seule commande en attente par offre et par client.
  const existing = (await sql`
    SELECT 1 FROM iptv_orders
    WHERE user_id = ${user.id} AND offer_id = ${offerId} AND status = 'pending'
  `) as unknown as unknown[];
  if (existing.length > 0) {
    return { fieldErrors: ["Vous avez déjà une commande en attente pour cette offre."] };
  }

  await sql`
    INSERT INTO iptv_orders
      (user_id, offer_id, kind, title, price_cents, package_id, template_id,
       max_connections, is_adult, mac, customer_note)
    VALUES
      (${user.id}, ${offer.id}, ${offer.kind}, ${offer.title}, ${offer.price_cents},
       ${offer.goldenott_package_id}, ${offer.goldenott_template_id},
       ${offer.max_connections}, ${offer.is_adult},
       ${offer.kind === "mag" ? mac : null}, ${customerNote})
  `;

  revalidatePath("/profil");
  revalidatePath("/admin/commandes");
  redirect("/profil?commande=1");
}

/** Le client demande le renouvellement d'un abonnement GoldenOTT existant. */
export async function createRenewalOrderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
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
    WHERE user_id = ${user.id} AND renew_sub_id = ${subId} AND status = 'pending'
  `) as unknown as unknown[];
  if (existing.length > 0) {
    return { fieldErrors: ["Une demande de renouvellement est déjà en attente."] };
  }

  await sql`
    INSERT INTO iptv_orders
      (user_id, offer_id, kind, title, price_cents, package_id, template_id,
       max_connections, is_adult, renew_sub_id, customer_note)
    VALUES
      (${user.id}, ${offer.id}, ${offer.kind},
       ${`Renouvellement — ${sub.label}`}, ${offer.price_cents},
       ${offer.goldenott_package_id}, ${offer.goldenott_template_id},
       ${offer.max_connections}, ${offer.is_adult}, ${subId},
       ${str(formData.get("customer_note")).slice(0, 500)})
  `;

  revalidatePath("/profil");
  revalidatePath("/admin/commandes");
  redirect("/profil?commande=1");
}

export async function cancelOrderAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const orderId = Number(formData.get("order_id")) || 0;
  await sql`
    UPDATE iptv_orders SET status = 'cancelled', decided_at = now()
    WHERE id = ${orderId} AND user_id = ${user.id} AND status = 'pending'
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
    revalidatePath("/admin/commandes");
    revalidatePath("/admin");
    redirect("/admin/commandes?ok=1");
  }

  /* ----- Nouvel abonnement ----- */
  const label = str(formData.get("label")) || order.title;
  let username = str(formData.get("username"));
  const password = String(formData.get("password") ?? "").trim();

  if (order.kind === "line" && !username) {
    username = `nexora${randomCredential(7).toLowerCase()}`;
  }
  if (order.kind === "line" && !/^[A-Za-z0-9._-]{3,64}$/.test(username)) {
    return { fieldErrors: ["Identifiant invalide (3 à 64 caractères)."] };
  }

  try {
    await provisionSubscription({
      userId: order.user_id,
      kind: order.kind,
      packageId: order.package_id,
      packageLabel: order.title,
      templateId: order.template_id,
      isAdult: order.is_adult,
      label,
      note: order.customer_note,
      actor: me.email,
      username: order.kind === "line" ? username : undefined,
      password:
        order.kind === "line" ? password || randomCredential(12) : undefined,
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

  revalidatePath("/admin/commandes");
  revalidatePath("/admin");
  redirect("/admin/commandes?ok=1");
}

export async function rejectOrderAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const orderId = Number(formData.get("order_id")) || 0;
  const adminNote = str(formData.get("admin_note")).slice(0, 500);
  await sql`
    UPDATE iptv_orders
    SET status = 'rejected', admin_note = ${adminNote}, decided_at = now()
    WHERE id = ${orderId} AND status = 'pending'
  `;
  revalidatePath("/admin/commandes");
  revalidatePath("/admin");
  redirect("/admin/commandes?ok=1");
}
