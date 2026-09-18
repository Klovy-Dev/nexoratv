"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { subscriptionById } from "@/lib/data";
import { GoldenottError, type GoldenottKind } from "@/lib/goldenott";
import {
  extendSubscriptionLocal,
  prepareLineCredentials,
  provisionSubscription,
  refundSubscriptionLocal,
  syncSubscriptionLocal,
  validateLineCredentials,
} from "@/lib/goldenott-provision";
import { isMac, normalizeMac, str } from "@/lib/validation";
import type { FormState } from "@/lib/types";

const KINDS: GoldenottKind[] = ["line", "mag", "code"];

function parseKind(value: FormDataEntryValue | null): GoldenottKind {
  const k = str(value) as GoldenottKind;
  return KINDS.includes(k) ? k : "line";
}

function errMessages(err: unknown): string[] {
  if (err instanceof GoldenottError) return err.allMessages;
  if (err instanceof Error) return [err.message];
  return ["Erreur inattendue lors de l'appel à GoldenOTT."];
}

/* ------------------------------------------------------------------ */
/*  Provisioning depuis le formulaire admin                            */
/* ------------------------------------------------------------------ */

export async function provisionSubscriptionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireAdmin();

  const userId = Number(formData.get("user_id")) || 0;
  const kind = parseKind(formData.get("kind"));
  const packageId = Number(formData.get("package_id")) || 0;
  const packageLabel = str(formData.get("package_label")) || null;
  const templateRaw = str(formData.get("template_id"));
  const templateId = templateRaw ? Number(templateRaw) : null;
  const domainRaw = str(formData.get("dns_domain_id"));
  const dnsDomainId = domainRaw ? Number(domainRaw) : null;
  const dnsDomainLabel = str(formData.get("dns_domain_label")) || null;
  const label = str(formData.get("label")) || "Abonnement IPTV";
  const note = str(formData.get("note"));
  const isAdult = formData.get("is_adult") === "on";
  const screensRaw = str(formData.get("screens"));

  const rawUsername = str(formData.get("username"));
  const rawPassword = String(formData.get("password") ?? "");
  let mac = str(formData.get("mac"));
  const creds = prepareLineCredentials(rawUsername, rawPassword);

  const errors: string[] = [];

  const target = (await sql`SELECT 1 FROM users WHERE id = ${userId}`) as unknown as unknown[];
  if (target.length === 0) errors.push("Client introuvable.");
  if (!packageId) errors.push("Choisissez un forfait GoldenOTT.");

  let maxConnections: number | null = null;
  if (screensRaw) {
    maxConnections = Number(screensRaw);
    if (!Number.isInteger(maxConnections) || maxConnections < 1 || maxConnections > 5) {
      errors.push("Le nombre de connexions doit être compris entre 1 et 5.");
    }
  }

  if (kind === "line") {
    errors.push(...validateLineCredentials(creds.username, creds.password));
  }
  if (kind === "mag") {
    if (!mac) errors.push("L'adresse MAC du boîtier est requise.");
    else if (!isMac(mac)) errors.push("Adresse MAC invalide (format 00:1A:79:XX:XX:XX).");
    else mac = normalizeMac(mac);
  }

  if (errors.length > 0) return { fieldErrors: errors };

  let remainingCredit: number | null = null;
  try {
    const { created } = await provisionSubscription({
      userId,
      kind,
      packageId,
      packageLabel,
      templateId,
      dnsDomainId,
      dnsDomainLabel,
      isAdult,
      label,
      note,
      actor: me.email,
      username: kind === "line" ? creds.username : undefined,
      password: kind === "line" ? creds.password : undefined,
      maxConnections,
      mac: kind === "mag" ? mac : undefined,
    });
    remainingCredit = created.remainingCredit;
  } catch (err) {
    return { fieldErrors: errMessages(err) };
  }

  revalidatePath("/admin");
  const flash =
    remainingCredit != null
      ? `&credit=${encodeURIComponent(remainingCredit.toFixed(2))}`
      : "";
  redirect(`/admin?user=${userId}&ok=provision${flash}`);
}

/* ------------------------------------------------------------------ */
/*  Prolonger                                                          */
/* ------------------------------------------------------------------ */

export async function extendSubscriptionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireAdmin();
  const subId = Number(formData.get("sub_id")) || 0;
  const userId = Number(formData.get("user_id")) || 0;
  const packageId = Number(formData.get("package_id")) || 0;
  const packageLabel = str(formData.get("package_label")) || null;

  if (!packageId) return { fieldErrors: ["Choisissez un forfait de prolongation."] };

  const sub = await subscriptionById(subId);
  if (!sub) return { fieldErrors: ["Abonnement introuvable."] };

  try {
    await extendSubscriptionLocal(sub, packageId, me.email, packageLabel);
  } catch (err) {
    return { fieldErrors: errMessages(err) };
  }

  revalidatePath("/admin");
  redirect(`/admin?user=${userId}&ok=extend`);
}

/* ------------------------------------------------------------------ */
/*  Rembourser (FormData brut + redirection)                           */
/* ------------------------------------------------------------------ */

export async function refundSubscriptionAction(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const subId = Number(formData.get("sub_id")) || 0;
  const userId = Number(formData.get("user_id")) || 0;
  const massRefund = formData.get("mass_refund") === "on";

  const sub = await subscriptionById(subId);
  let dest = `/admin?user=${userId}&ok=refund`;

  if (!sub) {
    dest = `/admin?user=${userId}&err=${encodeURIComponent("Abonnement introuvable")}`;
  } else {
    try {
      await refundSubscriptionLocal(sub, massRefund, me.email);
    } catch (err) {
      const msg = err instanceof GoldenottError ? err.message : "Échec du remboursement";
      dest = `/admin?user=${userId}&err=${encodeURIComponent(msg)}`;
    }
  }

  revalidatePath("/admin");
  redirect(dest);
}

/* ------------------------------------------------------------------ */
/*  Synchroniser un abonnement / tous ceux d'un client                 */
/* ------------------------------------------------------------------ */

export async function syncSubscriptionAction(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const subId = Number(formData.get("sub_id")) || 0;
  const userId = Number(formData.get("user_id")) || 0;

  const sub = await subscriptionById(subId);
  if (sub) {
    try {
      await syncSubscriptionLocal(sub, me.email);
    } catch {
      /* le message d'erreur est journalisé ; on redirige quand même */
    }
  }
  revalidatePath("/admin");
  redirect(`/admin?user=${userId}&ok=sync`);
}

export async function syncUserSubscriptionsAction(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const userId = Number(formData.get("user_id")) || 0;

  const subs = (await sql`
    SELECT id FROM subscriptions
    WHERE user_id = ${userId} AND provider = 'goldenott'
  `) as unknown as { id: number }[];

  for (const { id } of subs) {
    const sub = await subscriptionById(id);
    if (!sub) continue;
    try {
      await syncSubscriptionLocal(sub, me.email);
    } catch {
      /* continue avec les suivants */
    }
  }

  revalidatePath("/admin");
  redirect(`/admin?user=${userId}&ok=sync`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Une passe de synchro sur une liste d'ids, espacée pour rester sous le
 * seuil de rate-limit GoldenOTT ("Too Many Attempts."). Renvoie les ids
 * qui ont échoué avec leur dernier message d'erreur.
 */
async function syncBatch(
  ids: number[],
  actor: string,
  errorCounts: Map<string, number>,
): Promise<{ synced: number; failedIds: number[] }> {
  let synced = 0;
  const failedIds: number[] = [];
  for (const id of ids) {
    const sub = await subscriptionById(id);
    if (!sub) continue;
    try {
      await syncSubscriptionLocal(sub, actor);
      synced++;
    } catch (err) {
      failedIds.push(id);
      const key = err instanceof Error ? err.message : "erreur inconnue";
      errorCounts.set(key, (errorCounts.get(key) ?? 0) + 1);
    }
    await sleep(1200);
  }
  return { synced, failedIds };
}

/** Resynchronise TOUS les abonnements GoldenOTT, tous clients confondus
 * (statut, expiration, lien serveur — donc le lien M3U affiché en profil).
 *
 * GoldenOTT limite le débit ("Too Many Attempts.") bien en-deçà de ce
 * qu'on imaginait : un simple espacement ne suffit pas toujours. On
 * espace donc largement les appels (1,2 s) et, si des échecs subsistent,
 * on laisse la fenêtre de limitation se réinitialiser (15 s) avant de
 * retenter une seule fois ce sous-ensemble — plutôt que de retenter
 * chaque abonnement individuellement, ce qui ferait exploser la durée
 * totale sans rien résoudre (le problème est le rythme global, pas un
 * abonnement en particulier).
 */
export async function syncAllSubscriptionsAction(): Promise<void> {
  const me = await requireAdmin();

  const subs = (await sql`
    SELECT id FROM subscriptions WHERE provider = 'goldenott'
  `) as unknown as { id: number }[];

  const errorCounts = new Map<string, number>();
  let synced = 0;

  const first = await syncBatch(subs.map((s) => s.id), me.email, errorCounts);
  synced += first.synced;
  let failedIds = first.failedIds;

  if (failedIds.length > 0) {
    await sleep(15_000);
    errorCounts.clear();
    const retry = await syncBatch(failedIds, me.email, errorCounts);
    synced += retry.synced;
    failedIds = retry.failedIds;
  }

  const topError = [...errorCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const errorParam = topError
    ? `&err_sample=${encodeURIComponent(`${topError[0]} (×${topError[1]})`)}`
    : "";

  revalidatePath("/admin");
  redirect(
    `/admin?ok=sync-all&synced=${synced}&failed=${failedIds.length}${errorParam}`,
  );
}
