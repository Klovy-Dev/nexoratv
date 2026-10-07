import { createCipheriv, createHash, publicEncrypt, randomBytes, constants } from "crypto";
import { NextResponse } from "next/server";

/**
 * ROUTE TEMPORAIRE — migration vers le VPS. À supprimer juste après usage.
 * Renvoie les variables d'environnement chiffrées (AES-256-GCM, clé
 * enveloppée en RSA-OAEP avec la clé publique du VPS). Illisible sans la
 * clé privée, qui ne quitte pas le serveur.
 */
export const dynamic = "force-dynamic";

const TOKEN_SHA256 = "1728a904e2a86fda3d23df498793501956991bad6a7040195f4996d996a428ca";

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAkKIljV2CxDlD7MlzECK0
k9lagDbDSptSb72mQNO+vz4Z+S8Dw7tvsSiqzcgUtTL+DdufwWqheSCPV0uPSr9K
3YrlHBFixqOE9XHNR13j/04jECGTHctluxPIlxowm1Q0GbT0JReWpXXKRdkUO23h
MrVqEtHI1MEtUaLouSAblvXqc3LX9zvMtysM3SZwN5mpfOmmkqdq1yNvn2ObDY+q
BpRcGIVW0GG/ez1JeXFS2pObD0NS8iMPdfhHrcUSZKMNpr8Ef6tdDWcUtZ8rxIGn
7ESlTDiFn9tLvc+OYRC9w0d+ur7EGLkjkp48/gNtAejz//7zbpmNB6G6XpDwAsF5
VYX23EsHLIej5HCLRmMAL8mBSnO2WWWS4QrQGIoZUXVmfpExuWP15H95G0SwFmiL
LsRc0Cmv3DCS10fLkMzCX8YeCm9JJ0c5XkIG1P3k1fZtBo+w/liyeihMjyAKIMM9
KumcrxyazJT/aUSgoEdWkxrn0UwTiUD/buHCjGSVD+fNccdfKhTR9qK69JuDZAcP
kYsobquefMf2uGvXc/CZI1xKb87Msg33dzqd/ro094GMoDiA+yLuGsRR8iiIIQrV
CLx2ojYPxKAp26LPCeolslfNOMYJ5wmB4Blonmsvoae3yUhwF05XtDi1JwcYWSFs
Trweyn3MGjuJYu8vc3XoBqUCAwEAAQ==
-----END PUBLIC KEY-----`;

const KEYS = [
  "APP_URL", "AUTH_SECRET", "CRON_SECRET", "DATABASE_URL", "ENCRYPTION_KEY",
  "MAIL_FROM", "MAINTENANCE_MODE", "GOLDENOTT_API_KEY", "GOLDENOTT_API_URL",
  "STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET",
  "PAYPAL_ENV", "PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID",
  "RESEND_API_KEY", "ORDER_NOTIFY_EMAIL",
  "DISCORD_BOT_SECRET", "DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET",
  "DISCORD_ORDER_WEBHOOK_URL", "DISCORD_REVIEW_WEBHOOK_URL", "DISCORD_FEEDBACK_WEBHOOK_URL",
  "BITCOIN_ADDRESS", "BITCOIN_DISABLED", "MEMPOOL_API_URL",
  "ADMIN_EMAIL", "ADMIN_PASSWORD",
];

export async function GET(req: Request) {
  const token = req.headers.get("x-export-token") ?? "";
  if (createHash("sha256").update(token).digest("hex") !== TOKEN_SHA256) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const env: Record<string, string> = {};
  for (const k of KEYS) {
    const v = process.env[k];
    if (v !== undefined) env[k] = v;
  }
  const key = randomBytes(32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(env), "utf8"), cipher.final()]);
  const wrapped = publicEncrypt(
    { key: PUBLIC_KEY, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    key,
  );
  return NextResponse.json({
    key: wrapped.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: data.toString("base64"),
  });
}
