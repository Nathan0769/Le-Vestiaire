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
      "Méthode complète pour vérifier l'authenticité d'un maillot Nike grâce aux codes produits, étiquettes et détails de fabrication",
    scanAvailable: true,
    criteria: [
      {
        title: "Étape 1 : Le code produit (Product Code)",
        description:
          "Situé sur la petite étiquette sous l'étiquette de lavage, le code produit est votre premier indicateur",
        points: [
          "Format : 6 chiffres pour le style + 3 chiffres pour la couleur (ex: 894430-010)",
          "Le code style identifie le design/template du maillot",
          "Le code couleur (après le tiret) identifie la variante de couleur spécifique",
          "Tapez le code complet dans Google Images pour vérifier qu'il correspond EXACTEMENT à votre maillot",
          "ATTENTION : Les faux réutilisent souvent de vrais codes ! Si le code est pour la France 2020 Away (CD0069-100) mais sur un maillot d'une autre équipe = FAUX",
          "Les vieux maillots (avant 2010) peuvent ne pas avoir le code couleur, c'est normal",
        ],
      },
      {
        title: "Étape 2 : Le code de production (Production Code)",
        description:
          "Sur la même petite étiquette, ce code révèle quand le maillot a été fabriqué",
        points: [
          "Format : HO150407SYG (exemple = Holiday 2015, fabriqué d'Avril à Juillet)",
          "Les 2-3 premiers caractères = la saison : SP (Printemps), SU (Été), FA (Automne), HO (Holiday/Hiver)",
          "Les 2 chiffres suivants = l'année (15 = 2015, 23 = 2023)",
          "Les 4 chiffres suivants = mois de début et fin de production (0407 = avril à juillet)",
          "Ce code doit être cohérent avec la saison du maillot ! Un maillot 2023/24 ne peut pas avoir un code HO15",
          "Les faux réutilisent souvent des étiquettes sur différents maillots, créant des incohérences",
        ],
      },
      {
        title: "Étape 3 : L'étiquette boutique (Swing Tag)",
        description:
          "L'étiquette cartonnée attachée aux maillots neufs contient des informations cruciales",
        points: [
          "Placement moderne (depuis 2021/22) : une seule étiquette sur la manche GAUCHE uniquement",
          "2016-2020 : deux étiquettes, une sous chaque manche (aisselles)",
          "Avant 2016 : étiquette attachée au col",
          "L'autocollant doit être un VRAI autocollant physique, jamais imprimé directement",
          "Le barb (attache plastique) est TOUJOURS noir sur les vrais Nike",
          "Le code produit sur l'étiquette boutique DOIT correspondre à celui de la petite étiquette interne",
          "Barre de couleur de taille : Gris=XS, Jaune=S, Bleu=M, Rouge=L, Vert=XL, Blanc=XXL+",
        ],
      },
      {
        title: "Étape 4 : L'étiquette de taille dans le col",
        description:
          "L'étiquette du col contient des informations régionales importantes",
        points: [
          "Le pays de fabrication ('Made in...') DOIT correspondre entre l'étiquette col et l'étiquette de lavage",
          "Exemple : si le col dit 'Made in Indonesia', l'étiquette intérieure doit dire la même chose",
          "Vérifiez les correspondances de tailles régionales, surtout la taille japonaise (J)",
          "Erreur fréquente sur les faux : taille japonaise incorrecte (ex: 'J: S' pour un US L au lieu de 'J: 2XO')",
          "Tableau correct : US S=J M, US M=J L, US L=J 2XO, US XL=J 3XO, US XXL=J 4XO",
        ],
      },
      {
        title: "Étape 5 : L'étiquette de sécurité (Security Tag)",
        description:
          "Située en bas à droite du maillot, l'étiquette de sécurité contient un code unique",
        points: [
          "Le code alphanumérique DOIT être unique à votre maillot",
          "Si vous trouvez le même code sur plusieurs annonces en ligne = FAUX",
          "Sur les maillots récents : bande métallique/holographique de qualité qui change sous la lumière",
          "Les faux utilisent souvent une simple impression plate au lieu de la bande métallique",
          "Version joueur : accents dorés/métalliques | Version fan : accents argentés",
          "Certains détails cachés : mini logos Nike ou fragments du mot 'SECURITY' dans la bande",
          "Certaines versions anciennes : lettres 'HEN' ou les deux 'T' de 'AUTHENTIC' en matière brillante",
        ],
      },
      {
        title: "Étape 6 : Le Swoosh et les écussons",
        description:
          "La qualité d'application du logo Nike et de l'écusson du club est révélatrice",
        points: [
          "Le Swoosh doit être PARFAIT : forme précise, bords nets, pas de fils apparents",
          "Sur un maillot NEUF, le tissu autour du Swoosh doit être PLAT (pas de plissements)",
          "Retournez le maillot : l'intérieur derrière le Swoosh/écusson doit être propre, sans excès de tissu",
          "Écusson brodé = version fan | Écusson thermocollé/silicone = version joueur",
          "Vérifiez que le type d'écusson correspond bien à la version (fan ou joueur)",
          "Attention aux écussons mal placés, trop grands/petits, ou avec des coutures grossières",
        ],
      },
    ],
    commonFakes: [
      "Code produit correct mais pour un autre maillot/équipe (ex: code France 2020 sur un maillot Allemagne)",
      "Code de production incohérent avec la saison (maillot 2024 avec code HO15)",
      "Étiquette boutique avec autocollant imprimé au lieu d'un vrai sticker physique",
      "Barb d'attache de l'étiquette qui n'est pas noir",
      "'Made in...' différent entre l'étiquette col et l'étiquette de lavage",
      "Taille japonaise incorrecte dans l'étiquette du col",
      "Code de sécurité identique trouvé sur plusieurs annonces en ligne",
      "Bande de sécurité sans effet holographique/métallique (impression plate)",
      "Swoosh avec tissu plissé autour sur un maillot neuf",
      "Intérieur sale derrière le Swoosh/écusson (excès de tissu, coutures grossières)",
      "Code couleur incohérent (ex: maillot rouge avec code 100-199)",
      "Étiquette boutique mal placée (ex: au col sur un maillot post-2021)",
      "Barre de couleur de taille incorrecte ou absente sur l'étiquette boutique",
    ],
    tips: [
      "TOUJOURS vérifier le code produit complet (style + couleur) sur Google Images",
      "Comparer le code de production avec la saison du maillot pour détecter les incohérences",
      "Demander des photos de TOUTES les étiquettes : col, lavage, petite étiquette produit, étiquette boutique",
      "Vérifier la cohérence 'Made in...' entre toutes les étiquettes",
      "Pour les maillots neufs : exiger une photo de l'étiquette boutique avec son attache noire",
      "Chercher le code de sécurité en ligne pour vérifier son unicité",
      "Examiner la qualité du Swoosh et de l'écusson (retourner le maillot si possible)",
      "Utiliser le tableau des tailles régionales pour vérifier la cohérence de l'étiquette col",
      "Les maillots version joueur sans étiquette boutique sont normaux (distribution directe aux équipes)",
      "Méfiez-vous des prix trop bas : les vrais Nike gardent leur valeur",
      "En cas de doute sur n'importe quelle étiquette ou code : ne pas acheter",
    ],
  },

  puma: {
    brand: "puma",
    title: "Guide d'authentification Puma",
    description:
      "Méthode complète pour vérifier l'authenticité d'un maillot Puma grâce aux codes produits, étiquettes et détails de fabrication",
    scanAvailable: true,
    criteria: [
      {
        title: "Étape 1 : Le code produit (Style No / Article No)",
        description:
          "Trouvé sur une grande étiquette cousue sur le côté gauche du maillot",
        points: [
          "Format : 6 chiffres + 2 chiffres de variation (ex: 736251-01)",
          "Les 6 premiers chiffres = le modèle de base du maillot",
          "Les 2 derniers chiffres = la variation de couleur (plus récent, absent sur vieux maillots)",
          "Tapez le code sur kitcod.es ou Google Images pour vérifier qu'il correspond EXACTEMENT à votre maillot",
          "ATTENTION : Les faux réutilisent souvent de vrais codes ! Si le code est pour Marseille mais sur un maillot Milan = FAUX",
          "Les maillots avant 2000 peuvent ne pas avoir d'étiquette avec code produit, c'est normal",
        ],
      },
      {
        title: "Étape 2 : La date de production",
        description:
          "Sur les versions récentes de l'étiquette, Puma indique la date de production exacte",
        points: [
          "Format récent : Date complète visible (ex: 15/03/2023)",
          "Cette date doit être cohérente avec la saison du maillot",
          "Un maillot saison 2023/24 ne peut pas avoir une date de production en 2020",
          "Les faux réutilisent souvent la même étiquette sur différents maillots, créant des incohérences",
          "Si la date ne correspond pas à la saison = RED FLAG majeur",
        ],
      },
      {
        title: "Étape 3 : Le code de région de production",
        description:
          "Code alphanumérique sous la date de production indiquant l'usine",
        points: [
          "Format : TVNAO (exemple pour Vietnam, usine Alliance One)",
          "Premier caractère = Probablement 'T' pour Textile",
          "2 caractères suivants = Code pays ISO (VN=Vietnam, TH=Thaïlande, TR=Turquie)",
          "2 derniers caractères = Identifiant de l'usine spécifique",
          "Le code pays DOIT correspondre au 'Made in...' sur l'étiquette",
          "Vous pouvez vérifier les usines Puma officielles avec leurs listes publiques (2018, 2023, 2025)",
        ],
      },
      {
        title: "Étape 4 : Le code de marché régional",
        description:
          "Code sur le côté gauche de l'étiquette indiquant le marché de destination",
        points: [
          "AM = Americas (Amériques)",
          "AP = Asia Pacific (Asie-Pacifique)",
          "EU = Europe",
          "Ce code indique OÙ le produit devait être vendu, pas où il a été fabriqué",
          "Utile pour les collectionneurs cherchant des releases régionales spécifiques",
          "Peut avoir de légères variations dans l'emballage ou les informations de conformité",
        ],
      },
      {
        title: "Étape 5 : Le QR Code",
        description:
          "Les étiquettes Puma récentes incluent un QR code avec un numéro AD unique",
        points: [
          "QR code généralement situé sous le code produit",
          "Scanner le code redirige vers puma.com avec un numéro 'AD' en paramètre",
          "Format du lien : https://www.puma.com?TSL1D33P02450",
          "Le numéro AD est imprimé au-dessus du QR code",
          "Ce code sert au tracking interne et à l'authentification Puma",
          "Absence de QR code sur vieux maillots est normale",
        ],
      },
      {
        title: "Étape 6 : L'étiquette boutique (Swing Tag)",
        description: "L'étiquette cartonnée attachée au col des maillots neufs",
        points: [
          "L'autocollant doit être un VRAI autocollant physique, jamais imprimé directement",
          "Le code produit sur l'étiquette boutique DOIT correspondre à l'étiquette interne",
          "Les faux utilisent souvent un label générique type 'Puma Shirt' sans détails",
          "Un vrai label mentionne : Nom du club + Type de maillot (Home/Away) + Couleur",
          "Vérifiez les conventions de taille régionales : Brésil/Canada = 'G' (Grande) au lieu de 'L'",
          "Japon peut utiliser '2XO' au lieu de 'XL' - vérifiez la cohérence avec la région",
        ],
      },
      {
        title: "Étape 7 : L'étiquette du col et 'Made in'",
        description:
          "L'étiquette du col contient des informations régionales importantes",
        points: [
          "Le pays de fabrication ('Made in...') DOIT correspondre entre le col et toutes les étiquettes internes",
          "Exemple : si le col dit 'Made in Vietnam', l'étiquette de lavage doit dire la même chose",
          "Vérifiez les correspondances de tailles régionales, surtout la taille japonaise (J)",
          "Tableau correct : US S=J M, US M=J O (ou L récent), US L=J 2XO, US XL=J 3XO, US XXL=J 4XO",
          "Note : Puma récent utilise parfois 'L' au lieu de 'O' pour le Japon (alignement occidental)",
          "Erreur fréquente sur les faux : taille japonaise incorrecte (ex: 'J: S' pour un US L)",
        ],
      },
      {
        title: "Étape 8 : L'étiquette de sécurité",
        description:
          "Petite étiquette noire en bas à gauche du maillot (vue de face)",
        points: [
          "Sur les modèles récents : simplement marquée 'Authentic Licensed Football'",
          "Sur les anciens modèles : code alphanumérique unique",
          "Ce code ne devrait PAS apparaître dans les recherches (sauf si c'est un faux)",
          "L'étiquette doit être cousue proprement avec du fil de qualité",
          "Absence totale d'étiquette sur maillot récent = suspect",
        ],
      },
      {
        title: "Étape 9 : Le logo Puma (attention au 'Fat Cat')",
        description:
          "Le logo du félin bondissant doit être parfait - méfiez-vous du 'Fat Cat'",
        points: [
          "Le Puma doit être ÉLÉGANT et athlétique, pas trapu ou gonflé",
          "Le 'Fat Cat' = défaut typique des faux : chat trop épais, déformé, qui a l'air 'musclé'",
          "Forme caractéristique bien définie avec proportions exactes",
          "Broderie ou flocage de qualité avec bords nets",
          "Position exacte selon le modèle (généralement poitrine droite)",
          "Comparez toujours avec des photos officielles - même une légère différence = suspect",
        ],
      },
      {
        title: "Étape 10 : L'écusson du club",
        description: "L'écusson doit être appliqué avec précision",
        points: [
          "Broderie précise OU thermocollage de qualité selon le modèle",
          "Bords nets sans bavures",
          "Tous les éléments (étoiles, texte, bordures) parfaitement alignés",
          "Espacement correct et proportions respectées",
          "Pas de texte flou, décentré ou mal espacé",
          "Comparez avec l'écusson officiel du club - même les petits détails comptent",
        ],
      },
    ],
    commonFakes: [
      "Code produit correct mais pour un autre maillot/équipe (ex: code Marseille sur maillot Milan)",
      "Date de production incohérente avec la saison du maillot",
      "Code de région de production (ex: TVNAO) ne correspondant pas au 'Made in...'",
      "Étiquette boutique générique marquée 'Puma Shirt' sans mention du club",
      "Autocollant imprimé sur l'étiquette boutique au lieu d'un vrai sticker",
      "'Made in...' différent entre l'étiquette col et l'étiquette de lavage/produit",
      "Taille japonaise incorrecte dans l'étiquette du col (ex: J:S pour US L au lieu de J:2XO)",
      "Code de sécurité qui apparaît sur plusieurs maillots en ligne (devrait être unique)",
      "Le fameux 'Fat Cat' - logo Puma déformé, trapu ou trop épais",
      "Écusson du club avec texte flou, éléments décentrés ou proportions incorrectes",
      "Coutures grossières ou fils apparents sur le logo/écusson",
      "Absence d'étiquette de sécurité sur un maillot récent",
      "Fautes de frappe ou grammaire incorrecte sur les étiquettes de lavage",
      "QR code absent sur maillot très récent (post-2020)",
    ],
    tips: [
      "TOUJOURS vérifier le code produit complet sur kitcod.es ou Google Images",
      "Vérifier que la date de production correspond bien à la saison du maillot",
      "Comparer le code de région (TVNAO) avec le 'Made in...' pour cohérence",
      "Demander des photos de TOUTES les étiquettes : col, lavage, grande étiquette produit, étiquette boutique",
      "Scanner le QR code si présent et vérifier qu'il mène bien vers puma.com avec un paramètre AD",
      "Examiner le logo Puma de PRÈS - le 'Fat Cat' est un défaut très courant des faux",
      "Comparer l'écusson du club pixel par pixel avec des photos officielles",
      "Vérifier la cohérence des tailles régionales dans l'étiquette col (surtout taille japonaise)",
      "Consulter les listes officielles d'usines Puma si vous voulez vérifier le code d'usine",
      "Pour les maillots neufs : exiger une photo de l'étiquette boutique avec le nom du club visible",
      "Méfiez-vous des prix trop bas : les vrais Puma gardent leur valeur",
      "En cas de doute sur n'importe quelle étiquette, logo ou code : ne pas acheter",
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
