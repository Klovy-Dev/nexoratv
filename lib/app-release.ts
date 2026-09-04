/**
 * Dernière version publiée de l'application NexoraTV (dépôt GitHub
 * `Klovy-Dev/nexoratv-app`). Utilisé par la page /telecharger.
 *
 * La réponse GitHub est mise en cache 30 min (ISR) pour rester bien en
 * dessous de la limite d'API non authentifiée (60 req/h/IP).
 */

const REPO = "Klovy-Dev/nexoratv-app";
export const RELEASES_URL = `https://github.com/${REPO}/releases`;

export interface AppAsset {
  name: string;
  url: string;
  size: number;
}

export interface AppRelease {
  version: string; // ex. "1.1.0"
  tag: string; // ex. "v1.1.0"
  publishedAt: string | null;
  windowsInstaller: AppAsset | null;
  windowsPortable: AppAsset | null;
  androidApk: AppAsset | null;
}

type GhAsset = { name: string; browser_download_url: string; size: number };
type GhRelease = {
  tag_name: string;
  name: string | null;
  published_at: string | null;
  assets: GhAsset[];
};

function pick(assets: GhAsset[], test: (n: string) => boolean): AppAsset | null {
  const a = assets.find((x) => test(x.name.toLowerCase()));
  return a ? { name: a.name, url: a.browser_download_url, size: a.size } : null;
}

export async function getLatestAppRelease(): Promise<AppRelease | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 1800 },
      },
    );
    if (!res.ok) return null;
    const r = (await res.json()) as GhRelease;
    const assets = r.assets ?? [];

    return {
      version: r.tag_name.replace(/^v/, ""),
      tag: r.tag_name,
      publishedAt: r.published_at,
      windowsInstaller: pick(
        assets,
        (n) => n.endsWith(".exe") && n.includes("setup"),
      ),
      windowsPortable: pick(
        assets,
        (n) => n.endsWith(".zip") && n.includes("windows"),
      ),
      androidApk: pick(assets, (n) => n.endsWith(".apk")),
    };
  } catch {
    return null;
  }
}

export function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb < 100 ? 1 : 0)} Mo`;
}
