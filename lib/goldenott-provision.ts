import "server-only";
import { revalidateTag } from "next/cache";
import { sql } from "@/lib/db";
import { encryptSecret, randomCode } from "@/lib/crypto";
import { logGoldenottEvent } from "@/lib/data";
import {
  isTrialPackage,
  loadGoldenottCatalog,
  type GoldenottCatalog,
} from "@/lib/goldenott-catalog";
import {
  createSubscription,
  extendSubscription,
  getSubscription,
  GOLDENOTT_TAG,
  GoldenottError,
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
/*  Options « adulte » / « français uniquement » cochées à la commande */
/* ------------------------------------------------------------------ */

/**
 * Templates GoldenOTT dédiés aux options cochées à la commande — recherchés
 * par NOM plutôt que par id figé en dur (un id gravé dans le code casse
 * silencieusement si le template est un jour recréé sur le panel) :
 *   - "French"      : chaînes/films/séries 100 % français, SANS adulte
 *                     (choisie quand « français uniquement » ET « sans
 *                     adulte » sont cochées ensemble)
 *   - "Nexora"       : chaînes/films/séries 100 % français, AVEC adulte
 *   - "FRANCE-LIST"  : bouquet complet SANS adulte (choisie quand seule
 *                     l'exclusion adulte est cochée, sans « français
 *                     uniquement »)
 */
const FRENCH_ONLY_TEMPLATE_NAME = "French";
const FRENCH_ADULT_TEMPLATE_NAME = "Nexora";
const NO_ADULT_TEMPLATE_NAME = "FRANCE-LIST";

function findTemplateByName(
  catalog: GoldenottCatalog,
  name: string,
  context: string,
): number | null {
  const tpl = catalog.templates.find((t) => t.name === name);
  if (!tpl) {
    console.error(
      `[goldenott-provision] template "${name}" introuvable dans le catalogue — ` +
        `${context} provisionnée avec le template par défaut de l'offre.`,
    );
    return null;
  }
  return tpl.id;
}

/**
 * Traduit les options cochées par le client au moment de la commande
 * (want_adult / want_french / no_adult) en template + flag adulte à
 * transmettre à GoldenOTT, en plus du réglage par défaut de l'offre.
 */
export function resolveProvisioningOptions(
  order: {
    is_adult: boolean;
    want_adult: boolean;
    want_french: boolean;
    no_adult: boolean;
    template_id: number | null;
  },
  catalog: GoldenottCatalog,
): { isAdult: boolean; templateId: number | null } {
  // no_adult (exclusion demandée par le client) est prioritaire sur
  // is_adult/want_adult : une offre qui inclut les chaînes adultes par
  // défaut peut être provisionnée sans, si le client l'a demandé.
  const isAdult = order.no_adult ? false : order.is_adult || order.want_adult;

  if (order.want_french) {
    const wantedName = isAdult ? FRENCH_ADULT_TEMPLATE_NAME : FRENCH_ONLY_TEMPLATE_NAME;
    const templateId =
      findTemplateByName(catalog, wantedName, "commande « français uniquement »") ??
      order.template_id;
    return { isAdult, templateId };
  }

  if (order.no_adult) {
    const templateId =
      findTemplateByName(catalog, NO_ADULT_TEMPLATE_NAME, "commande « sans chaîne adulte »") ??
      order.template_id;
    return { isAdult, templateId };
  }

  return { isAdult, templateId: order.template_id };
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
  /** forfait d'essai 24 h → abonnement purgé automatiquement à l'expiration */
  isTrial?: boolean;
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
    // Contexte de la requête ayant échoué : sans ça, un "Database error
    // occurred" générique renvoyé par GoldenOTT ne dit pas lequel du
    // package/template/domaine était en cause — l'admin devait rejouer une
    // enquête manuelle à chaque occurrence.
    const ctx =
      `[pkg ${opts.packageId}` +
      (opts.templateId ? ` · tpl ${opts.templateId}` : "") +
      (opts.dnsDomainId ? ` · dom ${opts.dnsDomainId}` : "") +
      `]`;
    const rawMessage = err instanceof Error ? err.message : "échec de création";
    const message = `${ctx} ${rawMessage}`;
    await logGoldenottEvent({
      actor: opts.actor,
      action: "create",
      kind: opts.kind,
      ok: false,
      message,
    });
    throw err instanceof GoldenottError
      ? new GoldenottError(message, err.status, err.fields)
      : err;
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
       note, screens, is_trial, provider, provider_kind, provider_ref, package_id,
       package_label, provider_status, mac, qr_url, dns_domain_id, dns_domain,
       synced_at)
    VALUES
      (${opts.userId}, ${opts.label}, ${serverUrl}, ${displayUser},
       ${encryptSecret(displayPass)}, ${created.expiresAt}, 'active',
       ${opts.note ?? ""}, ${created.maxConnections ?? opts.maxConnections ?? null},
       ${opts.isTrial ?? false},
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

  // Un essai (is_trial=true) prolongé vers un forfait payant doit perdre son
  // statut d'essai, sinon la purge quotidienne (purgeExpiredTrialsAndRejected)
  // peut le supprimer silencieusement dès que sa DATE D'ESSAI D'ORIGINE est
  // dépassée — même si le nouveau forfait payant est, lui, encore valide.
  const catalog = await loadGoldenottCatalog();
  const isTrial = isTrialPackage(catalog, packageId);

  await sql`
    UPDATE subscriptions SET
      expires_at = COALESCE(${result.expiresAt}::date, expires_at),
      package_id = ${packageId},
      package_label = ${packageLabel ?? sub.package_label},
      is_trial = ${isTrial},
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
  // GoldenOTT indique lui-même si le forfait actuellement actif est un essai :
  // corrige is_trial sans jamais toucher à la durée réelle (utile quand une
  // prolongation vers un forfait payant a laissé is_trial=true en base).
  const nextIsTrial = remote.isTrial ?? sub.is_trial;
  const changed =
    nextExpiry !== sub.expires_at ||
    nextStatus !== sub.status ||
    nextIsTrial !== sub.is_trial ||
    (remote.status ?? null) !== sub.provider_status;

  await sql`
    UPDATE subscriptions SET
      expires_at = ${nextExpiry}::date,
      status = ${nextStatus},
      is_trial = ${nextIsTrial},
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
