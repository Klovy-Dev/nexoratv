import { NextResponse } from "next/server";
import { sendDueExpiryReminders } from "@/lib/expiry-mail";

/**
 * Rappels d'échéance par e-mail (J-5 puis J-1), une fois par jour.
 *
 * Planifié dans `vercel.json`, après la synchro GoldenOTT de 3 h pour
 * travailler sur des échéances à jour. Vercel envoie
 * `Authorization: Bearer $CRON_SECRET`.
 *
 * Appel manuel :
 *   curl -H "Authorization: Bearer <CRON_SECRET>" https://.../api/cron/expiry-reminders
 */

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const report = await sendDueExpiryReminders();
  return NextResponse.json({ ok: true, ...report, at: new Date().toISOString() });
}
