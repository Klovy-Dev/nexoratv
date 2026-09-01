import "server-only";
import { revalidateTag } from "next/cache";
import { sql } from "@/lib/db";
import { encryptSecret, randomCode } from "@/lib/crypto";
import { logGoldenottEvent } from "@/lib/data";
import {
  createSubscription,
  extendSubscription,
  getSubscription,
  GOLDENOTT_TAG,
  refundSubscription,
  type CreatedSubscription,
  type GoldenottKind,
} from "@/lib/goldenott";
import type { SubscriptionView } from "@/lib/types";

/**
 * Couche « métier » entre les Server Actions et le client GoldenOTT.
 * Toutes les opérations qui touchent à la fois l'API distante ET la base
 * locale passent par ici, et journalisent leur résultat.
 */

/* ------------------------------------------------------------------ */
/*  Identifiants de ligne M3U — contraintes imposées par GoldenOTT     */
/*    identifiant : 7 à 12 caractères, lettres + chiffres              */
/*    mot de passe : EXACTEMENT 7 caractères, MAJUSCULES + chiffres    */
/* ------------------------------------------------------------------ */

export function prepareLineCredentials(
  rawUsername: string,
  rawPassword: string,
): { username: string; password: string } {
  const username = (rawUsername.trim() || randomCode(10)).replace(/[^A-Za-z0-9]/g, "");
  const password = (rawPassword.trim() || randomCode(7)).toUpperCase();
  return { username, password };
}

export function validateLineCredentials(
  username: string,
  password: string,
): string[] {
  const errors: string[] = [];
  if (!/^[A-Za-z0-9]{7,12}$/.test(username)) {
    errors.push(
      "Identifiant : 7 à 12 caractères, lettres et chiffres uniquement (ni espace ni caractère spécial).",
    );
  }
  if (!/^[A-Z0-9]{7}$/.test(password)) {
    errors.push(
      "Mot de passe : exactement 7 caractères, en MAJUSCULES et chiffres. Laisse le champ vide pour en générer un valide.",
    );
  }
  return errors;
}

/* ------------------------------------------------------------------ */
/*  Traduction du statut distant → statut local                        */
/* ------------------------------------------------------------------ */

/**
 * GoldenOTT expose des statuts variés (Active, Online, Expired, Banned,
 * Disabled, Waiting…). On les ramène à notre modèle : active / suspended.
 * L'expiration, elle, est déduite de la date (logique existante).
 */
function localStatus(remoteStatus: string | null, enabled: number | null):
  | "active"
  | "suspended" {
  const s = (remoteStatus ?? "").toLowerCase();
  if (["banned", "disabled", "expired"].some((k) => s.includes(k))) {
    return "suspended";
  }
  if (enabled === 0) return "suspended";
  return "active";
}

/* ------------------------------------------------------------------ */
/*  Création                                                           */
/* ------------------------------------------------------------------ */

export interface ProvisionOptions {
  userId: number;
  kind: GoldenottKind;
  packageId: number;
  packageLabel?: string | null;
  templateId?: number | null;
  dnsDomainId?: number | null;
  dnsDomainLabel?: string | null;
  isAdult?: boolean;
  label: string;
  note?: string;
  actor: string;
  /** line */
  username?: string;
  password?: string;
  maxConnections?: number | null;
  /** mag */
  mac?: string;
  /** rattache la commande à l'abonnement créé */
  orderId?: number;
}

export interface ProvisionResult {
  subscriptionId: number;
  created: CreatedSubscription;
}

export async function provisionSubscription(
  opts: ProvisionOptions,
): Promise<ProvisionResult> {
  let created: CreatedSubscription;
  try {
    created = await createSubscription(opts.kind, {
      packageId: opts.packageId,
      templateId: opts.templateId ?? null,
      dnsDomainId: opts.dnsDomainId ?? null,
      isAdult: opts.isAdult,
      notes: opts.note || `NexoraTV — client #${opts.userId}`,
      username: opts.username,
      password: opts.password,
      maxConnections: opts.maxConnections ?? null,
      mac: opts.mac,
    });
  } catch (err) {
    await logGoldenottEvent({
      actor: opts.actor,
      action: "create",
      kind: opts.kind,
      ok: false,
      message: err instanceof Error ? err.message : "échec de création",
    });
    throw err;
  }

  // La création ne renvoie pas le lien du serveur (dns_link) ni le statut :
  // on tente un GET juste après pour enrichir la fiche. Sans bloquer.
  let serverUrl = "";
  let providerStatus: string | null = null;
  try {
    const remote = await getSubscription(opts.kind, created.id);
    serverUrl = remote.dnsLink ?? "";
    providerStatus = remote.status;
  } catch {
    /* enrichissement best-effort */
  }

  // Ligne : identifiant = username. Code : on stocke le code dans username.
  const displayUser =
    opts.kind === "code"
      ? created.code ?? ""
      : created.username ?? opts.username ?? "";
  const displayPass = opts.kind === "line" ? created.password ?? opts.password ?? "" : "";

  const rows = (await sql`
    INSERT INTO subscriptions
      (user_id, label, server_url, username, password_enc, expires_at, status,
       note, screens, provider, provider_kind, provider_ref, package_id,
       package_label, provider_status, mac, qr_url, dns_domain_id, dns_domain,
       synced_at)
    VALUES
      (${opts.userId}, ${opts.label}, ${serverUrl}, ${displayUser},
       ${encryptSecret(displayPass)}, ${created.expiresAt}, 'active',
       ${opts.note ?? ""}, ${created.maxConnections ?? opts.maxConnections ?? null},
       'goldenott', ${opts.kind}, ${String(created.id)}, ${opts.packageId},
       ${opts.packageLabel ?? null}, ${providerStatus}, ${created.mac ?? null},
       ${created.qrUrl}, ${opts.dnsDomainId ?? null}, ${opts.dnsDomainLabel ?? null},
       now())
    RETURNING id
  `) as unknown as { id: number }[];

  const subscriptionId = rows[0].id;

  if (opts.orderId) {
    await sql`
      UPDATE iptv_orders
      SET status = 'fulfilled', subscription_id = ${subscriptionId}, decided_at = now()
      WHERE id = ${opts.orderId}
    `;
  }

  await logGoldenottEvent({
    actor: opts.actor,
    action: "create",
    kind: opts.kind,
    providerRef: String(created.id),
    subscriptionId,
    ok: true,
    message: `${created.creditsUsed ?? "?"} crédits · reste ${
      created.remainingCredit ?? "?"
    }`,
  });

  revalidateTag(GOLDENOTT_TAG); // le crédit revendeur a changé
  return { subscriptionId, created };
}

/* ------------------------------------------------------------------ */
/*  Prolongation                                                       */
/* ------------------------------------------------------------------ */

export async function extendSubscriptionLocal(
  sub: SubscriptionView,
  packageId: number,
  actor: string,
  packageLabel?: string | null,
): Promise<{ expiresAt: string | null; remainingCredit: number | null }> {
  if (sub.provider !== "goldenott" || !sub.provider_kind || !sub.provider_ref) {
    throw new Error("Cet abonnement n'est pas géré par GoldenOTT.");
  }

  let result;
  try {
    result = await extendSubscription(
      sub.provider_kind,
      sub.provider_ref,
      packageId,
    );
  } catch (err) {
    await logGoldenottEvent({
      actor,
      action: "extend",
      kind: sub.provider_kind,
      providerRef: sub.provider_ref,
      subscriptionId: sub.id,
      ok: false,
      message: err instanceof Error ? err.message : "échec de prolongation",
    });
    throw err;
  }

  await sql`
    UPDATE subscriptions SET
      expires_at = COALESCE(${result.expiresAt}::date, expires_at),
      package_id = ${packageId},
      package_label = ${packageLabel ?? sub.package_label},
      status = 'active',
      synced_at = now()
    WHERE id = ${sub.id}
  `;

  await logGoldenottEvent({
    actor,
    action: "extend",
    kind: sub.provider_kind,
    providerRef: sub.provider_ref,
    subscriptionId: sub.id,
    ok: true,
    message: `expire le ${result.expiresAt ?? "?"} · reste ${
      result.remainingCredit ?? "?"
    }`,
  });

  revalidateTag(GOLDENOTT_TAG);
  return { expiresAt: result.expiresAt, remainingCredit: result.remainingCredit };
}

/* ------------------------------------------------------------------ */
/*  Remboursement                                                      */
/* ------------------------------------------------------------------ */

export async function refundSubscriptionLocal(
  sub: SubscriptionView,
  massRefund: boolean,
  actor: string,
): Promise<{ message: string; remainingCredit: number | null }> {
  if (sub.provider !== "goldenott" || !sub.provider_kind || !sub.provider_ref) {
    throw new Error("Cet abonnement n'est pas géré par GoldenOTT.");
  }

  let result;
  try {
    result = await refundSubscription(
      sub.provider_kind,
      sub.provider_ref,
      massRefund,
    );
  } catch (err) {
    await logGoldenottEvent({
      actor,
      action: "refund",
      kind: sub.provider_kind,
      providerRef: sub.provider_ref,
      subscriptionId: sub.id,
      ok: false,
      message: err instanceof Error ? err.message : "échec du remboursement",
    });
    throw err;
  }

  await sql`
    UPDATE subscriptions SET status = 'suspended', synced_at = now()
    WHERE id = ${sub.id}
  `;

  await logGoldenottEvent({
    actor,
    action: "refund",
    kind: sub.provider_kind,
    providerRef: sub.provider_ref,
    subscriptionId: sub.id,
    ok: true,
    message: `${result.message} · reste ${result.remainingCredit ?? "?"}`,
  });

  revalidateTag(GOLDENOTT_TAG);
  return result;
}

/* ------------------------------------------------------------------ */
/*  Synchronisation                                                    */
/* ------------------------------------------------------------------ */

export async function syncSubscriptionLocal(
  sub: SubscriptionView,
  actor: string,
): Promise<{ changed: boolean; message: string }> {
  if (sub.provider !== "goldenott" || !sub.provider_kind || !sub.provider_ref) {
    return { changed: false, message: "abonnement non-GoldenOTT ignoré" };
  }

  let remote;
  try {
    remote = await getSubscription(sub.provider_kind, sub.provider_ref);
  } catch (err) {
    await logGoldenottEvent({
      actor,
      action: "sync",
      kind: sub.provider_kind,
      providerRef: sub.provider_ref,
      subscriptionId: sub.id,
      ok: false,
      message: err instanceof Error ? err.message : "échec de synchronisation",
    });
    throw err;
  }

  const nextStatus = localStatus(remote.status, remote.enabled);
  const nextExpiry = remote.expiresAt ?? sub.expires_at;
  const changed =
    nextExpiry !== sub.expires_at ||
    nextStatus !== sub.status ||
    (remote.status ?? null) !== sub.provider_status;

  await sql`
    UPDATE subscriptions SET
      expires_at = ${nextExpiry}::date,
      status = ${nextStatus},
      provider_status = ${remote.status},
      server_url = COALESCE(NULLIF(${remote.dnsLink ?? ""}, ''), server_url),
      synced_at = now()
    WHERE id = ${sub.id}
  `;

  await logGoldenottEvent({
    actor,
    action: "sync",
    kind: sub.provider_kind,
    providerRef: sub.provider_ref,
    subscriptionId: sub.id,
    ok: true,
    message: changed
      ? `MAJ : ${remote.status ?? "?"}, expire ${nextExpiry ?? "?"}`
      : "aucun changement",
  });

  return {
    changed,
    message: changed ? "Abonnement mis à jour." : "Déjà à jour.",
  };
}
