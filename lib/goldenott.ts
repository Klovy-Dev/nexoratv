import "server-only";

/**
 * Client de l'API revendeur GoldenOTT (https://goldenott.net/api).
 *
 * Toutes les routes exigent l'en-tête `X-API-Key` : le token de ton compte
 * revendeur, défini dans la variable d'environnement GOLDENOTT_API_KEY.
 * Cette clé ne quitte JAMAIS le serveur (module `server-only`).
 *
 * Trois types d'abonnement existent côté GoldenOTT ; on les désigne ici par
 * un « kind » unique :
 *   - "line" : ligne M3U (identifiant + mot de passe)      → /v1/lines
 *   - "mag"  : boîtier MAG / Stalker (adresse MAC)          → /v1/mags
 *   - "code" : code d'activation (à saisir dans une appli)  → /v1/active-codes
 */

export type GoldenottKind = "line" | "mag" | "code";

const KIND_PATH: Record<GoldenottKind, string> = {
  line: "lines",
  mag: "mags",
  code: "active-codes",
};

export const KIND_LABEL: Record<GoldenottKind, string> = {
  line: "Ligne M3U",
  mag: "Boîtier MAG",
  code: "Code d'activation",
};

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */

function baseUrl(): string {
  return (process.env.GOLDENOTT_API_URL ?? "https://goldenott.net/api").replace(
    /\/+$/,
    "",
  );
}

/** true si la clé API est configurée. À utiliser pour masquer l'UI sinon. */
export function goldenottConfigured(): boolean {
  return Boolean(process.env.GOLDENOTT_API_KEY);
}

/* ------------------------------------------------------------------ */
/*  Erreur typée                                                       */
/* ------------------------------------------------------------------ */

export class GoldenottError extends Error {
  status: number;
  /** Détail des erreurs de validation renvoyé par l'API (clé → messages). */
  fields: Record<string, string[]>;

  constructor(message: string, status = 0, fields: Record<string, string[]> = {}) {
    super(message);
    this.name = "GoldenottError";
    this.status = status;
    this.fields = fields;
  }

  /** Liste plate de tous les messages, pratique pour l'affichage. */
  get allMessages(): string[] {
    const flat = Object.values(this.fields).flat();
    return flat.length > 0 ? flat : [this.message];
  }
}

/* ------------------------------------------------------------------ */
/*  Appel bas niveau                                                   */
/* ------------------------------------------------------------------ */

interface ApiEnvelope {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  [key: string]: unknown;
}

async function call<T = ApiEnvelope>(
  path: string,
  init: RequestInit & { method: string },
): Promise<T> {
  const apiKey = process.env.GOLDENOTT_API_KEY;
  if (!apiKey) {
    throw new GoldenottError(
      "GOLDENOTT_API_KEY absente : l'intégration GoldenOTT n'est pas configurée.",
    );
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: {
        "X-API-Key": apiKey,
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "erreur réseau";
    throw new GoldenottError(`GoldenOTT injoignable (${reason}).`);
  }

  const text = await res.text();
  let body: ApiEnvelope = {};
  if (text) {
    try {
      body = JSON.parse(text) as ApiEnvelope;
    } catch {
      body = { message: text.slice(0, 300) };
    }
  }

  if (!res.ok || body.success === false) {
    const msg =
      body.message ||
      {
        401: "Clé API GoldenOTT invalide ou absente.",
        403: "Ton compte revendeur GoldenOTT n'a pas la permission pour cette action.",
        404: "Ressource introuvable côté GoldenOTT.",
        422: "Données refusées par GoldenOTT.",
        429: "Trop de requêtes vers GoldenOTT, réessaie dans un instant.",
      }[res.status] ||
      `Erreur GoldenOTT (HTTP ${res.status}).`;
    throw new GoldenottError(msg, res.status, body.errors ?? {});
  }

  return body as T;
}

/* ------------------------------------------------------------------ */
/*  Compte revendeur                                                   */
/* ------------------------------------------------------------------ */

export interface GoldenottProfile {
  username: string;
  credit: number;
  role: string;
  lastLogin: string | null;
}

export async function getProfile(): Promise<GoldenottProfile> {
  const r = await call<{
    data: {
      username: string;
      credit: number | string;
      role: string;
      last_login: string | null;
    };
  }>("/v1/account/profile", { method: "GET" });

  return {
    username: r.data.username,
    credit: num(r.data.credit) ?? 0,
    role: r.data.role,
    lastLogin: r.data.last_login ?? null,
  };
}

export interface GoldenottTemplate {
  id: number;
  name: string;
  country_code: string;
  has_adult: boolean;
  scope: "global" | "parent" | "own";
}

export async function listTemplates(): Promise<GoldenottTemplate[]> {
  const r = await call<{
    data: {
      global?: Omit<GoldenottTemplate, "scope">[];
      parent_templates?: Omit<GoldenottTemplate, "scope">[];
      own?: Omit<GoldenottTemplate, "scope">[];
    };
  }>("/v1/account/templates", { method: "GET" });

  const d = r.data ?? {};
  return [
    ...(d.own ?? []).map((t) => ({ ...t, scope: "own" as const })),
    ...(d.parent_templates ?? []).map((t) => ({ ...t, scope: "parent" as const })),
    ...(d.global ?? []).map((t) => ({ ...t, scope: "global" as const })),
  ];
}

/* ------------------------------------------------------------------ */
/*  Packages (forfaits)                                                */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Domaines DNS                                                       */
/* ------------------------------------------------------------------ */

export interface GoldenottDomain {
  id: number;
  domain: string;
  forBypass: boolean;
  forTv: boolean;
  isDefault: boolean;
  global: boolean;
  heritable: boolean;
}

function mapDomain(d: Record<string, unknown>): GoldenottDomain {
  return {
    id: Number(d.id),
    domain: String(d.domain ?? ""),
    forBypass: bool(d.for_bypass),
    forTv: bool(d.for_tv),
    isDefault: bool(d.is_default),
    global: bool(d.global),
    heritable: bool(d.heritable),
  };
}

/**
 * Tous les domaines accessibles. L'API renvoie par défaut les domaines
 * « normaux » ; les domaines bypass ne sortent qu'avec ?bypass=true — on
 * fait donc les deux appels et on fusionne.
 */
export async function listDomains(): Promise<GoldenottDomain[]> {
  const [normal, bypass] = await Promise.all([
    call<{ data: Record<string, unknown>[] }>("/v1/account/domains", {
      method: "GET",
    }),
    call<{ data: Record<string, unknown>[] }>("/v1/account/domains?bypass=true", {
      method: "GET",
    }).catch(() => ({ data: [] as Record<string, unknown>[] })),
  ]);

  const byId = new Map<number, GoldenottDomain>();
  for (const d of [...(normal.data ?? []), ...(bypass.data ?? [])]) {
    const dom = mapDomain(d);
    if (dom.id) byId.set(dom.id, dom);
  }
  return [...byId.values()].sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault) || a.domain.localeCompare(b.domain),
  );
}

export interface GoldenottPackage {
  id: number;
  name: string;
  /** coût en crédits revendeur d'une souscription/prolongation */
  credits: number | null;
  /** ex. « 1 an », « 6 mois », « 24 heures » */
  durationLabel: string | null;
  maxConnections: number | null;
  isTrial: boolean;
  isPaidTrial: boolean;
  hasAdult: boolean;
}

const DURATION_FR: Record<string, [string, string]> = {
  hours: ["heure", "heures"],
  days: ["jour", "jours"],
  weeks: ["semaine", "semaines"],
  months: ["mois", "mois"],
  years: ["an", "ans"],
};

function durationLabel(n: unknown, unit: unknown): string | null {
  const count = num(n);
  const key = typeof unit === "string" ? unit : "";
  if (!count || !DURATION_FR[key]) return null;
  const [one, many] = DURATION_FR[key];
  return `${count} ${count > 1 ? many : one}`;
}

/** Récupère TOUS les packages accessibles (pagine automatiquement). */
export async function listPackages(): Promise<GoldenottPackage[]> {
  const out: GoldenottPackage[] = [];
  let page = 1;
  // Garde-fou : 20 pages max.
  for (let i = 0; i < 20; i++) {
    const r = await call<{
      packages: {
        data: Record<string, unknown>[];
        current_page: number;
        last_page: number;
      };
    }>(`/v1/packages?per_page=100&page=${page}&sort_by=package_name&sort_order=asc`, {
      method: "GET",
    });

    const pk = r.packages;
    for (const p of pk?.data ?? []) {
      const isTrial = bool(p.is_trial);
      out.push({
        id: Number(p.id),
        name: String(p.package_name ?? `Package #${p.id}`),
        credits: isTrial ? num(p.trial_credits) : num(p.official_credits),
        durationLabel: isTrial
          ? durationLabel(p.trial_duration, p.trial_duration_in)
          : durationLabel(p.official_duration, p.official_duration_in),
        maxConnections: num(p.max_connections),
        isTrial,
        isPaidTrial: bool(p.is_paid_trial),
        hasAdult: bool(p.has_adult),
      });
    }
    if (!pk || pk.current_page >= pk.last_page) break;
    page++;
  }

  // Tri par coût croissant (essais gratuits d'abord), fait côté client car
  // l'API n'accepte que sort_by=package_name.
  return out.sort((a, b) => (a.credits ?? 0) - (b.credits ?? 0));
}

/* ------------------------------------------------------------------ */
/*  Création d'un abonnement                                           */
/* ------------------------------------------------------------------ */

export interface CreateInput {
  packageId: number;
  templateId?: number | null;
  /** domaine DNS à assigner (lignes M3U et boîtiers MAG uniquement) */
  dnsDomainId?: number | null;
  isAdult?: boolean;
  notes?: string | null;
  /** line uniquement */
  username?: string;
  password?: string;
  maxConnections?: number | null;
  /** mag uniquement */
  mac?: string;
}

export interface CreatedSubscription {
  /** ID de l'abonnement côté GoldenOTT (sert pour extend / refund / sync). */
  id: number;
  /** ISO court AAAA-MM-JJ. */
  expiresAt: string | null;
  /** line / code activé */
  username: string | null;
  password: string | null;
  /** code uniquement */
  code: string | null;
  /** mag uniquement */
  mac: string | null;
  maxConnections: number | null;
  creditsUsed: number | null;
  remainingCredit: number | null;
  /** lien de mise à jour des bouquets (QR), valable 24 h */
  qrUrl: string | null;
}

function toDate(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  // Les essais non activés renvoient "Waiting" au lieu d'une date.
  const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/** L'API renvoie parfois les nombres sous forme de chaîne ("4.60"). */
function num(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** L'API renvoie les booléens tantôt en true/false, tantôt en 1/0. */
function bool(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

export async function createSubscription(
  kind: GoldenottKind,
  input: CreateInput,
): Promise<CreatedSubscription> {
  const body: Record<string, unknown> = { package_id: input.packageId };
  if (input.templateId) body.template_id = input.templateId;
  if (input.isAdult) body.is_adult = true;
  if (input.notes) body.notes = input.notes.slice(0, 1000);

  if (kind === "line") {
    body.username = input.username;
    body.password = input.password;
    if (input.maxConnections) body.max_connections = input.maxConnections;
    if (input.dnsDomainId) body.dns_domain_id = input.dnsDomainId;
  } else if (kind === "mag") {
    body.mac = input.mac;
    if (input.dnsDomainId) body.dns_domain_id = input.dnsDomainId;
  }

  const r = await call<{
    data: Record<string, unknown> | Record<string, unknown>[];
    package?: { credits_used?: number };
    account?: { remaining_credit?: number };
    qr?: { url?: string } | null;
  }>(`/v1/${KIND_PATH[kind]}`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  // /v1/lines renvoie data sous forme de tableau, les autres sous forme d'objet.
  const d = (Array.isArray(r.data) ? r.data[0] : r.data) ?? {};

  return {
    id: Number(d.id),
    expiresAt: toDate(d.exp_date ?? d.expires_at),
    username: (d.username as string) ?? null,
    password: (d.password as string) ?? null,
    code: (d.code as string) ?? null,
    mac: (d.mac as string) ?? input.mac ?? null,
    maxConnections: num(d.max_connections),
    creditsUsed: num(r.package?.credits_used),
    remainingCredit: num(r.account?.remaining_credit),
    qrUrl: r.qr?.url ?? null,
  };
}

/* ------------------------------------------------------------------ */
/*  Consultation d'un abonnement (sync)                                */
/* ------------------------------------------------------------------ */

export interface RemoteSubscription {
  id: number;
  expiresAt: string | null;
  username: string | null;
  password: string | null;
  mac: string | null;
  code: string | null;
  dnsLink: string | null;
  /** état lisible : Active / Expired / Banned / Disabled… (line) */
  status: string | null;
  /** 1 = actif, 0 = désactivé (mag) */
  enabled: number | null;
  packageName: string | null;
  isUsed: boolean | null;
}

export async function getSubscription(
  kind: GoldenottKind,
  remoteId: number | string,
): Promise<RemoteSubscription> {
  const r = await call<{ data: Record<string, unknown> }>(
    `/v1/${KIND_PATH[kind]}/${remoteId}`,
    { method: "GET" },
  );
  const d = r.data ?? {};
  const pkg = d.package as { package_name?: string; name?: string } | undefined;

  return {
    id: Number(d.id),
    expiresAt: toDate(d.exp_date ?? d.expires_at),
    username: (d.username as string) ?? null,
    password: (d.password as string) ?? null,
    mac: (d.mac as string) ?? null,
    code: (d.code as string) ?? null,
    dnsLink: (d.dns_link as string) ?? null,
    status: (d.status as string) ?? null,
    enabled:
      typeof d.enabled === "number"
        ? d.enabled
        : typeof d.admin_enabled === "number"
          ? (d.admin_enabled as number)
          : null,
    packageName: pkg?.package_name ?? pkg?.name ?? null,
    isUsed: "is_used" in d ? bool(d.is_used) : null,
  };
}

/* ------------------------------------------------------------------ */
/*  Prolongation                                                       */
/* ------------------------------------------------------------------ */

export interface ExtendResult {
  expiresAt: string | null;
  creditsUsed: number | null;
  remainingCredit: number | null;
}

export async function extendSubscription(
  kind: GoldenottKind,
  remoteId: number | string,
  packageId: number,
): Promise<ExtendResult> {
  const r = await call<{
    data?: { exp_date?: string };
    package?: { credits_used?: number };
    account?: { remaining_credit?: number };
  }>(`/v1/${KIND_PATH[kind]}/${remoteId}/extend`, {
    method: "POST",
    body: JSON.stringify({ package_id: packageId }),
  });

  return {
    expiresAt: toDate(r.data?.exp_date),
    creditsUsed: num(r.package?.credits_used),
    remainingCredit: num(r.account?.remaining_credit),
  };
}

/* ------------------------------------------------------------------ */
/*  Remboursement                                                      */
/* ------------------------------------------------------------------ */

export interface RefundResult {
  message: string;
  remainingCredit: number | null;
}

export async function refundSubscription(
  kind: GoldenottKind,
  remoteId: number | string,
  massRefund = false,
): Promise<RefundResult> {
  const r = await call<{
    message?: string;
    account?: { remaining_credit?: number };
    data?: { remaining_credit?: number };
  }>(`/v1/${KIND_PATH[kind]}/${remoteId}/refund`, {
    method: "POST",
    body: JSON.stringify({ mass_refund: massRefund }),
  });

  return {
    message: r.message ?? "Remboursement effectué.",
    remainingCredit: num(r.account?.remaining_credit ?? r.data?.remaining_credit),
  };
}
