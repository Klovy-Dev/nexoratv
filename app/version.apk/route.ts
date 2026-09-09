import { NextResponse } from "next/server";
import { getLatestAppRelease, RELEASES_URL } from "@/lib/app-release";

/**
 * Lien court de sideload : nexoratv.fr/version.apk
 *
 * Se termine par « .apk » pour que l'app **Downloader** (Fire TV / Android TV
 * / box) le traite en téléchargement direct plutôt que de l'ouvrir dans son
 * navigateur. Se tape dans son champ URL ou sert de cible à un code aftv.news.
 * Redirige (302, jamais mis en cache) vers le dernier APK publié, sans jamais
 * changer d'adresse.
 *
 * `nexoratv.fr/apk` reste actif (compat : code Downloader existant).
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const release = await getLatestAppRelease();
  const target = release?.androidApk?.url ?? RELEASES_URL;
  return NextResponse.redirect(target, { status: 302 });
}
