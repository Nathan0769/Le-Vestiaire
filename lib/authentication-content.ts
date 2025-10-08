import type { BrandInfo, BrandGuide } from "@/types/authentication";

export const BRANDS: BrandInfo[] = [
  {
    id: "adidas",
    name: "Adidas",
    logo: "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/adidas/logo.png",
    description: "Vérifiez l'authenticité de vos maillots Adidas",
    color: "#000000",
  },
  {
    id: "nike",
    name: "Nike",
    logo: "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/nike/logo.png",
    description: "Vérifiez l'authenticité de vos maillots Nike",
    color: "#FF3B00",
  },
  {
    id: "puma",
    name: "Puma",
    logo: "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/puma/logo.png",
    description: "Vérifiez l'authenticité de vos maillots Puma",
    color: "#000000",
  },
  {
    id: "hummel",
    name: "Hummel",
    logo: "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/hummel/logo.png",
    description: "Vérifiez l'authenticité de vos maillots Hummel",
    color: "#003DA5",
  },
];

export const BRAND_GUIDES: Record<string, BrandGuide> = {
  adidas: {
    brand: "adidas",
    title: "Guide d'authentification Adidas",
    description:
      "Méthode complète pour vérifier l'authenticité d'un maillot Adidas grâce aux codes produits et étiquettes",
    scanAvailable: true,
    criteria: [
      {
        title: "Étape 1 : Localiser l'étiquette avec le code produit",
        description:
          "L'étiquette se trouve généralement dans le col à droite, ou parfois en bas du maillot avec les instructions de lavage",
        points: [
          "Cherchez l'étiquette cousue dans le col (côté droit)",
          "Si elle n'est pas dans le col, regardez en bas du maillot près des instructions de lavage",
          "Cette étiquette contient 3 codes essentiels : taille, code produit (milieu), et code fabrication",
          "Si l'étiquette a été découpée par le vendeur, impossible de vérifier l'authenticité",
        ],
      },
      {
        title: "Étape 2 : Le code produit (CODE LE PLUS IMPORTANT)",
        description:
          "Le code produit du milieu est la clé pour vérifier l'authenticité. Exemple : IB0907",
        points: [
          "Identifiez le code au MILIEU de l'étiquette (ex: IB0907, HS5184, P95985)",
          "Ce code est unique par modèle de maillot (domicile, extérieur, third)",
          "Tapez ce code dans Google Images : les résultats doivent correspondre EXACTEMENT à votre maillot",
          "Exemple : 'IB0907' = Maillot extérieur OL 2023/2024 uniquement",
          "Si le code correspond à un autre club/saison = C'EST UN FAUX",
          "Exception : Certains petits clubs partagent le même code (templates communs), mais c'est rare",
        ],
      },
      {
        title: "Étape 3 : L'étiquette boutique (si présente)",
        description:
          "L'étiquette cartonnée accrochée au maillot neuf contient des informations précieuses",
        points: [
          "Sur un VRAI maillot : Le nom du club est clairement indiqué (ex: 'OL', 'Manchester United')",
          "La mention du type est présente : 'H' (Home), 'A' (Away), 'T' (Third)",
          "Le code produit est écrit au-dessus du nom du modèle",
          "FAUX si marqué uniquement 'adidas JSY' sans nom de club = CONTREFAÇON",
          "Attention : Ces étiquettes peuvent être retirées et remises sur un faux maillot !",
        ],
      },
      {
        title:
          "Étape 4 : Le code-barres numérique (vérification supplémentaire)",
        description:
          "Le code-barres de l'étiquette boutique permet une vérification précise",
        points: [
          "Trouvez le code numérique sous le code-barres (ex: 4066761557500)",
          "Allez sur ean-search.org et entrez ce code",
          "Le résultat doit correspondre EXACTEMENT à votre maillot",
          "Exemple : 4066761557500 = 'adidas Lyon Away Shirt 2023/24'",
          "Si le code correspond à un autre maillot = FAUX",
          "Note : Adidas n'inscrit PAS ce code sur l'étiquette cousue, uniquement sur l'étiquette boutique",
        ],
      },
      {
        title: "Étape 5 : Vérifications visuelles complémentaires",
        description:
          "Après avoir vérifié les codes, examinez la qualité générale",
        points: [
          "Logo Adidas : Les 3 bandes doivent être parfaitement alignées et brodées proprement",
          "Coutures : Droites, régulières, sans fils qui dépassent",
          "Tissu : Matière technique (Climalite, Climacool, Aeroready) mentionnée sur l'étiquette",
          "Pas d'odeur chimique forte ou de colle visible",
        ],
      },
    ],
    commonFakes: [
      "Étiquette boutique marquée 'adidas JSY' sans nom de club",
      "Code produit qui correspond à un autre maillot (ex: HS5184 pour Man Utd = maillot de Flamengo)",
      "Code-barres numérique incorrect (ex: correspond à Allemagne 2017 au lieu de Man Utd 2024)",
      "Étiquette dans le col découpée ou absente (vendeur suspect)",
      "Aucun résultat sur Google Images pour le code produit",
      "Logo Adidas déformé, mal brodé ou imprimé (au lieu de brodé)",
      "Prix anormalement bas (50-70% moins cher que le prix officiel)",
      "Vendeur qui refuse de montrer l'étiquette du col en photo",
    ],
    tips: [
      "TOUJOURS demander une photo de l'étiquette dans le col avant d'acheter",
      "Vérifier le code produit sur Google Images (méthode la plus fiable)",
      "Privilégier les vendeurs avec réputation établie et avis positifs",
      "Comparer avec les photos officielles du site Adidas ou du club",
      "Méfiez-vous des prix trop attractifs (réduction > 50% = suspect)",
      "Cette méthode fonctionne même pour les vieux maillots (années 2000+)",
      "Utiliser ean-search.org pour le code-barres si étiquette boutique présente",
      "En cas de doute : Ne pas acheter. Un vrai maillot garde sa valeur, un faux non",
    ],
  },
  nike: {
    brand: "nike",
    title: "Guide d'authentification Nike",
    description:
      "Apprenez à identifier un véritable maillot Nike avec ces critères essentiels",
    scanAvailable: false,
    criteria: [
      {
        title: "L'étiquette principale",
        description: "L'étiquette Nike contient des informations cruciales",
        points: [
          "Code produit (SKU) unique à 6-9 chiffres",
          "Logo Swoosh bien imprimé",
          "Informations de taille claires",
          "Made in... clairement indiqué",
          "Numéro de série unique sur les modèles récents",
        ],
      },
      {
        title: "Le logo Swoosh",
        description: "Le Swoosh Nike doit être parfait",
        points: [
          "Forme exacte et proportionnée",
          "Broderie de qualité sans fils apparents",
          "Couleur uniforme et vive",
          "Positionnement précis sur le maillot",
          "Pas de bavures d'impression",
        ],
      },
      {
        title: "La technologie Dri-FIT",
        description: "Les maillots Nike utilisent la technologie Dri-FIT",
        points: [
          "Logo Dri-FIT présent sur l'étiquette",
          "Tissu technique respirant",
          "Évacuation rapide de la transpiration",
          "Matière douce et confortable",
          "Séchage rapide",
        ],
      },
      {
        title: "Les finitions",
        description: "La qualité des finitions est un indicateur clé",
        points: [
          "Coutures droites et régulières",
          "Col bien structuré",
          "Badge du club parfaitement appliqué",
          "Numéros et noms thermocollés de qualité",
          "Pas de colle visible",
        ],
      },
    ],
    commonFakes: [
      "Swoosh déformé ou mal positionné",
      "Étiquette avec fautes ou impression floue",
      "Tissu de mauvaise qualité",
      "Code produit inexistant ou invalide",
      "Emballage générique sans branding Nike",
    ],
    tips: [
      "Vérifiez le code SKU sur le site Nike",
      "Comparez avec les photos officielles",
      "Attention aux vendeurs non vérifiés",
      "Le prix doit être cohérent avec le marché",
      "Demandez toujours des photos détaillées",
    ],
  },
  puma: {
    brand: "puma",
    title: "Guide d'authentification Puma",
    description:
      "Apprenez à identifier un véritable maillot Puma avec ces critères essentiels",
    scanAvailable: false,
    criteria: [
      {
        title: "L'étiquette principale",
        description: "L'étiquette Puma contient des éléments distinctifs",
        points: [
          "Logo Puma clairement imprimé",
          "Code article unique",
          "Informations de composition détaillées",
          "Instructions de lavage en plusieurs langues",
          "Qualité d'impression professionnelle",
        ],
      },
      {
        title: "Le logo Puma",
        description: "Le logo du félin bondissant doit être parfait",
        points: [
          "Forme caractéristique bien définie",
          "Broderie ou flocage de qualité",
          "Proportions respectées",
          "Couleurs nettes et uniformes",
          "Position exacte selon le modèle",
        ],
      },
      {
        title: "La technologie dryCELL",
        description: "Les maillots Puma modernes utilisent dryCELL",
        points: [
          "Mention dryCELL sur l'étiquette",
          "Tissu technique respirant",
          "Évacuation efficace de l'humidité",
          "Confort optimal pendant l'effort",
          "Matière légère et résistante",
        ],
      },
      {
        title: "La qualité de fabrication",
        description: "Les détails de fabrication sont révélateurs",
        points: [
          "Coutures solides et régulières",
          "Finitions soignées au niveau du col",
          "Badge du club bien fixé",
          "Impression des numéros de qualité",
          "Pas de défauts visibles",
        ],
      },
    ],
    commonFakes: [
      "Logo Puma déformé ou mal placé",
      "Étiquette de mauvaise qualité",
      "Tissu qui se froisse facilement",
      "Coutures irrégulières ou qui lâchent",
      "Prix suspect (trop bas)",
    ],
    tips: [
      "Privilégiez les revendeurs officiels Puma",
      "Comparez avec les modèles officiels en boutique",
      "Vérifiez la cohérence du code article",
      "Examinez attentivement la qualité du logo",
      "Méfiez-vous des offres trop alléchantes",
    ],
  },
  hummel: {
    brand: "hummel",
    title: "Guide d'authentification Hummel",
    description:
      "Apprenez à identifier un véritable maillot Hummel avec ces critères essentiels",
    scanAvailable: false,
    criteria: [
      {
        title: "L'étiquette principale",
        description: "L'étiquette Hummel a des caractéristiques spécifiques",
        points: [
          "Logo Hummel avec les chevrons distinctifs",
          "Code produit unique",
          "Informations de taille et composition",
          "Origine de fabrication indiquée",
          "Impression nette et durable",
        ],
      },
      {
        title: "Les chevrons Hummel",
        description: "Les chevrons sont la signature de la marque",
        points: [
          "Forme en V caractéristique",
          "Angles précis à 45 degrés",
          "Broderie de qualité supérieure",
          "Alignement parfait des chevrons",
          "Couleurs vives et contrastées",
        ],
      },
      {
        title: "La qualité du textile",
        description: "Hummel utilise des matériaux de qualité",
        points: [
          "Tissu technique respirant",
          "Matière agréable au toucher",
          "Résistance à l'usure",
          "Couleurs qui ne délavent pas",
          "Propriétés anti-transpiration",
        ],
      },
      {
        title: "Les finitions",
        description: "Les détails de finition sont importants",
        points: [
          "Coutures droites et solides",
          "Col bien structuré et confortable",
          "Badge du club de qualité premium",
          "Impression des numéros durable",
          "Assemblage soigné",
        ],
      },
    ],
    commonFakes: [
      "Chevrons mal alignés ou déformés",
      "Étiquette floue ou avec erreurs",
      "Tissu de qualité inférieure",
      "Logo Hummel approximatif",
      "Coutures qui se défont rapidement",
    ],
    tips: [
      "Achetez chez des revendeurs Hummel agréés",
      "Comparez les chevrons avec des modèles authentiques",
      "Vérifiez la qualité générale de fabrication",
      "Examinez l'étiquette en détail",
      "Un prix trop bas doit alerter",
    ],
  },
};

export function getBrandGuide(brand: string): BrandGuide | null {
  return BRAND_GUIDES[brand] || null;
}

export function getBrandInfo(brand: string): BrandInfo | null {
  return BRANDS.find((b) => b.id === brand) || null;
}
