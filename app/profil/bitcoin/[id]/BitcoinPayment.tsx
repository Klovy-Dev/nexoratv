"use client";

import { useActionState, useEffect, useState } from "react";
import { submitBitcoinTxidAction } from "@/actions/order-actions";
import CopyButton from "@/components/CopyButton";
import FormErrors from "@/components/FormErrors";
import SubmitButton from "@/components/SubmitButton";
import type { FormState } from "@/lib/types";

type Status =
  | { state: "waiting" }
  | { state: "seen"; confirmations: number; txUrl: string };

const POLL_MS = 20_000;
const initialForm: FormState = {};

export default function BitcoinPayment({
  orderId,
  address,
  btc,
  uri,
  qrSvg,
  expiresAt,
  rateEur,
  minConfirmations,
  initial,
}: {
  orderId: number;
  address: string;
  btc: string;
  uri: string;
  qrSvg: string;
  expiresAt: string | null;
  rateEur: number | null;
  minConfirmations: number;
  initial: Status;
}) {
  const [status, setStatus] = useState<Status>(initial);
  const [formState, formAction] = useActionState(submitBitcoinTxidAction, initialForm);

  // Vérification périodique : redirige dès que le paiement est confirmé,
  // recharge (nouveau cours) si le montant a expiré sans paiement.
  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/bitcoin/status?order=${orderId}`, { cache: "no-store" });
        if (!res.ok || stopped) return;
        const data = (await res.json()) as {
          state: "waiting" | "seen" | "paid" | "closed";
          confirmations?: number;
          txUrl?: string;
          expired?: boolean;
        };
        if (data.state === "paid" || data.state === "closed") {
          window.location.href = "/profil?commande=1";
        } else if (data.state === "seen") {
          setStatus({ state: "seen", confirmations: data.confirmations ?? 0, txUrl: data.txUrl ?? "" });
        } else if (data.expired) {
          window.location.reload();
        }
      } catch {
        /* réseau : on retentera au prochain tour */
      }
    };
    const timer = setInterval(tick, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [orderId]);

  const expiryTime = expiresAt
    ? new Date(expiresAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : null;

  if (status.state === "seen") {
    return (
      <div className="flash flash-success">
        <strong>Paiement détecté ✓</strong>
        <p style={{ margin: "8px 0 0" }}>
          Votre transaction attend sa confirmation sur la blockchain (
          {Math.min(status.confirmations, minConfirmations)}/{minConfirmations}, environ 10 à
          30 minutes). Votre abonnement sera activé automatiquement et vous recevrez un
          e-mail. Vous pouvez fermer cette page.
        </p>
        {status.txUrl && (
          <p style={{ margin: "8px 0 0" }}>
            <a href={status.txUrl} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>
              Suivre la transaction ↗
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <p style={{ marginBottom: 16 }}>
        Envoyez <strong>exactement</strong> le montant ci-dessous à cette adresse. Le
        montant exact permet de reconnaître votre paiement automatiquement.
      </p>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <div
          aria-label="QR code de paiement Bitcoin"
          style={{ background: "#fff", padding: 10, borderRadius: 12, width: 240, lineHeight: 0 }}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      </div>

      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <div className="cred-row">
          <span className="k">Montant</span>
          <span className="v">{btc} BTC</span>
          <CopyButton value={btc} />
        </div>
        <div className="cred-row">
          <span className="k">Adresse</span>
          <span className="v">{address}</span>
          <CopyButton value={address} />
        </div>
      </div>

      <a href={uri} className="btn btn-primary btn-block" style={{ marginBottom: 12 }}>
        Ouvrir dans mon portefeuille
      </a>

      <p className="hint" style={{ textAlign: "center" }}>
        {expiryTime && <>Montant garanti jusqu&apos;à {expiryTime}</>}
        {rateEur ? ` · cours 1 BTC = ${rateEur.toLocaleString("fr-FR")} €` : ""}
        <br />
        Cette page se met à jour toute seule dès que votre paiement est détecté.
      </p>

      <div className="flash flash-info" style={{ marginTop: 16 }}>
        Si vous payez depuis une plateforme d&apos;échange (Binance, Coinbase…), vérifiez que
        les frais de retrait ne sont pas déduits du montant envoyé : il doit arriver
        complet.
      </div>

      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: "pointer" }}>
          J&apos;ai envoyé un montant différent / mon paiement n&apos;est pas détecté
        </summary>
        <form action={formAction} style={{ marginTop: 12 }}>
          <FormErrors state={formState} />
          <input type="hidden" name="order_id" value={orderId} />
          <div className="form-group">
            <label htmlFor="btc-txid">Identifiant de la transaction (txid)</label>
            <input
              id="btc-txid"
              name="txid"
              className="input"
              placeholder="64 caractères, visible dans votre portefeuille"
              autoComplete="off"
              spellCheck={false}
              required
            />
          </div>
          <SubmitButton className="btn btn-ghost" pendingLabel="Vérification…">
            Vérifier ma transaction
          </SubmitButton>
        </form>
      </details>
    </>
  );
}
