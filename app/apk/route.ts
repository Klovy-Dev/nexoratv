import { NextResponse } from "next/server";
import { getLatestAppRelease, RELEASES_URL } from "@/lib/app-release";

/**
 * Lien court pour sideload direct : nexoratv.fr/apk
 *
 * Pensé pour l'appli **Downloader** (Fire TV / Android TV / box) — se tape
 * dans son champ URL, ou sert de cible à un code créé sur aftv.news — et
 * pour dicter un lien par téléphone. Redirige (302, jamais mis en cache)
 * vers le dernier APK publié sur GitHub, sans jamais changer d'adresse.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const release = await getLatestAppRelease();
  const target = release?.androidApk?.url ?? RELEASES_URL;
  return NextResponse.redirect(target, { status: 302 });
}
