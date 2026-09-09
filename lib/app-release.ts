/**
 * Dernière version publiée de l'application NexoraTV.
 *
 * Source de vérité = le manifeste **`update.json`** du dépôt
 * `Klovy-Dev/nexoratv-app` (tenu à jour par la CI, un bloc par plateforme).
 * On ne se fie plus à `releases/latest` : depuis le passage aux tags par
 * plateforme (`win-v*`, `android-v*`, `ios-v*`), « latest » sur GitHub = la
 * dernière plateforme publiée, pas forcément celle qu'on veut servir — et la
 * liste `/releases` n'est pas triée de façon fiable par date.
 */

const REPO = "Klovy-Dev/nexoratv-app";
export const RELEASES_URL = `https://github.com/${REPO}/releases`;
const MANIFEST_URL = `https://raw.githubusercontent.com/${REPO}/main/update.json`;

/**
 * Lien court de sideload (redirige vers le dernier APK) — à taper dans
 * l'app Downloader sur Fire TV Stick / Android TV / box. Se termine par
 * « .apk » pour que Downloader le télécharge directement au lieu de
 * l'ouvrir dans son navigateur. `nexoratv.fr/apk` reste actif (compat).
 */
export const APK_SHORT_URL = "nexoratv.fr/version.apk";

/**
 * Code Downloader (aftv.news) associé à {@link APK_SHORT_URL} : se saisit
 * directement dans le champ « code » de l'app Downloader. À mettre à jour
 * ici si le code aftv.news change.
 */
export const DOWNLOADER_CODE = "3276026";

export interface AppAsset {
  name: string;
  url: string;
  size?: number;
}

export interface AppRelease {
  windowsVersion: string | null; // ex. "2.1.0"
  androidVersion: string | null; // ex. "1.3.5"
  windowsInstaller: AppAsset | null;
  androidApk: AppAsset | null;
}

type ManifestBlock = { version?: string; url?: string };
type Manifest = {
  windows?: ManifestBlock;
  android?: ManifestBlock;
  // Ancien format à plat (repli).
  version?: string;
  windows_url?: string;
  android_url?: string;
};

function asset(url: string | null | undefined): AppAsset | null {
  if (!url) return null;
  return { name: url.split("/").pop() || "download", url };
}

export async function getLatestAppRelease(): Promise<AppRelease | null> {
  try {
    const res = await fetch(MANIFEST_URL, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    const m = (await res.json()) as Manifest;
    return {
      windowsVersion: m.windows?.version ?? m.version ?? null,
      androidVersion: m.android?.version ?? m.version ?? null,
      windowsInstaller: asset(m.windows?.url ?? m.windows_url),
      androidApk: asset(m.android?.url ?? m.android_url),
    };
  } catch {
    return null;
  }
}

export function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb < 100 ? 1 : 0)} Mo`;
}
