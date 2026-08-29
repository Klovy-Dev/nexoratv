export interface DocPage {
  slug: string;
  label: string;
}

export interface DocGroup {
  title: string;
  pages: DocPage[];
}

export const TUTO_NAV: DocGroup[] = [
  {
    title: "Démarrage",
    pages: [{ slug: "/tuto", label: "Créer votre compte" }],
  },
  {
    title: "Installation",
    pages: [{ slug: "/tuto/applications", label: "Choisir son application" }],
  },
  {
    title: "Compatibilité",
    pages: [
      { slug: "/tuto/televiseurs", label: "Téléviseurs" },
      { slug: "/tuto/boitiers", label: "Box & Fire Stick" },
    ],
  },
  {
    title: "Utilisation",
    pages: [{ slug: "/tuto/connexion", label: "Se connecter" }],
  },
  {
    title: "Aide",
    pages: [{ slug: "/tuto/faq", label: "Questions fréquentes" }],
  },
];

export const TUTO_PAGES: DocPage[] = TUTO_NAV.flatMap((g) => g.pages);
