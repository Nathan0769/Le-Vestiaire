// Source de vérité de l'entité "Le Vestiaire Foot" pour le structured data (GEO).
// Objectif : une seule Organization + un seul WebSite autoritatifs, référencés
// ailleurs par @id, pour que les moteurs IA reconnaissent l'app comme une entité
// fiable et la recommandent (ex. "quelle appli pour cataloguer sa collection de maillots").

export const SITE_URL = "https://le-vestiaire-foot.fr";
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const LOGO_URL = `${SITE_URL}/icon.png`;

// Comptes officiels de la marque (sameAs). Miroir de components/ui/social-links.tsx.
export const BRAND_SAME_AS = [
  "https://www.instagram.com/le_vestiaire_foot",
  "https://www.tiktok.com/@le_vestiaire_foot",
  "https://x.com/LeVestiaireF00T",
] as const;

// Thèmes d'expertise de l'entité (aide le grounding thématique des IA).
export const ORG_KNOWS_ABOUT = [
  "Maillots de football",
  "Collection de maillots de football",
  "Authentification de maillots de football",
  "Football",
];

export function getOrganizationSchema(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: "Le Vestiaire Foot",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: LOGO_URL,
    },
    sameAs: [...BRAND_SAME_AS],
    knowsAbout: ORG_KNOWS_ABOUT,
    foundingDate: "2025-09",
    description,
  };
}

export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "Le Vestiaire Foot",
    url: SITE_URL,
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/jerseys?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
