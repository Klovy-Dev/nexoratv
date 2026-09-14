import "server-only";

/**
 * Client REST PayPal (Orders v2) — moyen de paiement alternatif à Stripe
 * sur /commander. Appels fetch bruts (pas de SDK), même esprit que
 * lib/goldenott.ts. Les identifiants (PAYPAL_CLIENT_ID / _SECRET) ne
 * quittent jamais le serveur.
 *
 * PAYPAL_ENV="sandbox" bascule sur l'environnement de test PayPal ; sans
 * cette variable (ou toute autre valeur), on utilise l'API live.
 */

export class PaypalError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

function baseUrl(): string {
  return process.env.PAYPAL_ENV === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

/* ------------------------------------------------------------------ */
/*  Authentification (jeton client_credentials, mis en cache)         */
/* ------------------------------------------------------------------ */

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) {
    throw new PaypalError(
      "PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET manquants : PayPal n'est pas configuré.",
    );
  }

  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new PaypalError("Authentification PayPal échouée.", data);
  }

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in ?? 300) * 1000,
  };
  return cachedToken.value;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new PaypalError(
      data?.message || `Requête PayPal échouée (${res.status}).`,
      data,
    );
  }
  return data as T;
}

/** `true` si l'erreur PayPal signale une commande déjà capturée. */
export function isAlreadyCaptured(err: unknown): boolean {
  if (!(err instanceof PaypalError)) return false;
  const details = err.details as { details?: { issue?: string }[] } | undefined;
  return details?.details?.some((d) => d.issue === "ORDER_ALREADY_CAPTURED") ?? false;
}

/* ------------------------------------------------------------------ */
/*  Commandes (Orders v2)                                              */
/* ------------------------------------------------------------------ */

export interface PaypalCreatedOrder {
  id: string;
  approveUrl: string;
}

export async function createPaypalOrder(opts: {
  amountCents: number;
  currency?: string;
  description: string;
  /** notre iptv_orders.id, pour retrouver la commande au webhook */
  customId: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<PaypalCreatedOrder> {
  const amount = (opts.amountCents / 100).toFixed(2);
  const data = await call<{ id: string; links: { rel: string; href: string }[] }>(
    "/v2/checkout/orders",
    {
      method: "POST",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: opts.customId,
            description: opts.description.slice(0, 127),
            amount: { currency_code: opts.currency ?? "EUR", value: amount },
          },
        ],
        application_context: {
          brand_name: "NexoraTV",
          user_action: "PAY_NOW",
          return_url: opts.returnUrl,
          cancel_url: opts.cancelUrl,
        },
      }),
    },
  );

  const approveUrl = data.links.find((l) => l.rel === "approve")?.href;
  if (!approveUrl) {
    throw new PaypalError("PayPal n'a pas renvoyé de lien d'approbation.", data);
  }
  return { id: data.id, approveUrl };
}

export interface PaypalCaptureResult {
  status: string;
  captureId: string | null;
}

function extractCaptureId(data: {
  purchase_units?: { payments?: { captures?: { id: string }[] } }[];
}): string | null {
  return data.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;
}

/** Capture définitivement les fonds d'une commande PayPal approuvée. */
export async function capturePaypalOrder(paypalOrderId: string): Promise<PaypalCaptureResult> {
  const data = await call<{
    status: string;
    purchase_units?: { payments?: { captures?: { id: string }[] } }[];
  }>(`/v2/checkout/orders/${paypalOrderId}/capture`, { method: "POST", body: "{}" });
  return { status: data.status, captureId: extractCaptureId(data) };
}

/** Relit une commande PayPal (statut + capture déjà effectuée le cas échéant). */
export async function getPaypalOrder(paypalOrderId: string): Promise<PaypalCaptureResult> {
  const data = await call<{
    status: string;
    purchase_units?: { payments?: { captures?: { id: string }[] } }[];
  }>(`/v2/checkout/orders/${paypalOrderId}`);
  return { status: data.status, captureId: extractCaptureId(data) };
}

/**
 * Capture une commande approuvée ; si elle l'est déjà (webhook + retour
 * client arrivés en même temps), relit simplement son état au lieu
 * d'échouer.
 */
export async function ensureCaptured(paypalOrderId: string): Promise<PaypalCaptureResult> {
  try {
    return await capturePaypalOrder(paypalOrderId);
  } catch (err) {
    if (isAlreadyCaptured(err)) return getPaypalOrder(paypalOrderId);
    throw err;
  }
}

export async function refundPaypalCapture(captureId: string): Promise<void> {
  await call(`/v2/payments/captures/${captureId}/refund`, { method: "POST", body: "{}" });
}

/* ------------------------------------------------------------------ */
/*  Webhooks                                                           */
/* ------------------------------------------------------------------ */

/**
 * Vérifie la signature d'un événement webhook PayPal via leur API dédiée
 * (contrairement à Stripe, PayPal ne signe pas en HMAC local).
 */
export async function verifyPaypalWebhook(opts: {
  headers: Headers;
  event: unknown;
}): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const data = await call<{ verification_status: string }>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: JSON.stringify({
        auth_algo: opts.headers.get("paypal-auth-algo"),
        cert_url: opts.headers.get("paypal-cert-url"),
        transmission_id: opts.headers.get("paypal-transmission-id"),
        transmission_sig: opts.headers.get("paypal-transmission-sig"),
        transmission_time: opts.headers.get("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: opts.event,
      }),
    },
  );
  return data.verification_status === "SUCCESS";
}
