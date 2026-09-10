import { NextResponse } from "next/server";

/**
 * nexoratv.fr/tv.apk — app **native Android** (repo Klovy-Dev/nexoratv-tv),
 * pour Fire TV / Android TV / box / téléphone.
 *
 * Se termine par « .apk » → Downloader télécharge direct. Redirige vers le
 * dernier APK publié en Release. (La version Flutter reste sur
 * nexoratv.fr/latest.apk pour Windows + iOS.)
 */
export const dynamic = "force-dynamic";

const LATEST =
  "https://github.com/Klovy-Dev/nexoratv-tv/releases/latest/download/NexoraTV-TV.apk";

export async function GET(): Promise<Response> {
  return NextResponse.redirect(LATEST, { status: 302 });
}
