import { NextResponse } from "next/server";
import { getLatestAppRelease, RELEASES_URL } from "@/lib/app-release";

/**
 * nexoratv.fr/latest.apk — toujours le dernier APK Android.
 *
 * Se termine par « .apk » : l'app Downloader (Fire TV) le télécharge
 * directement au lieu de l'ouvrir dans son navigateur interne (qui plante
 * sur Fire TV Stick). Pour une version précise : nexoratv.fr/1.3.8.apk
 * (redirect dans next.config.mjs). `nexoratv.fr/apk` reste actif (compat).
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const release = await getLatestAppRelease();
  const target = release?.androidApk?.url ?? RELEASES_URL;
  return NextResponse.redirect(target, { status: 302 });
}
