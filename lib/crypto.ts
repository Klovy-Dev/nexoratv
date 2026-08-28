import "server-only";
import crypto from "node:crypto";

/**
 * Chiffrement authentifié des identifiants d'abonnement (AES-256-GCM).
 * Le client doit pouvoir relire ces valeurs en clair : elles sont donc
 * chiffrées (réversible) et non hachées.
 */

function key(): Buffer {
  const hex = process.env.ENCRYPTION_KEY ?? "";
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY invalide : 64 caractères hexadécimaux attendus. " +
        'Générez : node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return buf;
}

export function encryptSecret(plain: string): string {
  if (!plain) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(encoded: string): string {
  if (!encoded) return "";
  try {
    const rawBuf = Buffer.from(encoded, "base64");
    const iv = rawBuf.subarray(0, 12);
    const tag = rawBuf.subarray(12, 28);
    const data = rawBuf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8",
    );
  } catch {
    return "";
  }
}
