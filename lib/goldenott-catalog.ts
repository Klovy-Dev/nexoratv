import "server-only";
import { cache } from "react";
import {
  getProfile,
  goldenottConfigured,
  listDomains,
  listPackages,
  listTemplates,
  type GoldenottDomain,
  type GoldenottPackage,
  type GoldenottTemplate,
} from "@/lib/goldenott";

/**
 * Charge en un appel tout ce dont l'UI admin a besoin de GoldenOTT :
 * profil (crédit), forfaits et templates. Toute erreur réseau est capturée
 * et renvoyée dans `error` — l'UI reste utilisable en mode dégradé.
 *
 * `cache()` dédoublonne l'appel sur la durée d'un rendu (plusieurs
 * composants peuvent l'utiliser sans multiplier les requêtes).
 */
export interface GoldenottCatalog {
  configured: boolean;
  error: string | null;
  credit: number | null;
  username: string | null;
  packages: GoldenottPackage[];
  templates: GoldenottTemplate[];
  domains: GoldenottDomain[];
}

export const loadGoldenottCatalog = cache(async (): Promise<GoldenottCatalog> => {
  if (!goldenottConfigured()) {
    return {
      configured: false,
      error: null,
      credit: null,
      username: null,
      packages: [],
      templates: [],
      domains: [],
    };
  }

  try {
    const [profile, packages, templates, domains] = await Promise.all([
      getProfile(),
      listPackages(),
      listTemplates(),
      listDomains(),
    ]);
    return {
      configured: true,
      error: null,
      credit: profile.credit,
      username: profile.username,
      packages,
      templates,
      domains,
    };
  } catch (err) {
    return {
      configured: true,
      error: err instanceof Error ? err.message : "erreur inconnue",
      credit: null,
      username: null,
      packages: [],
      templates: [],
      domains: [],
    };
  }
});
