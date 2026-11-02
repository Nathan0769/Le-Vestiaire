/**
 * Caractéristiques d'une annonce lues dans son titre (eBay, CFS, boutiques
 * partenaires). La base de la cote ne retient que la référence : maillot
 * supporter, manches courtes, coupe homme, sans flocage, vendu seul. La prime d'un exemplaire
 * (version, manches longues) est appliquée ensuite par valueForItem.
 */

export type ListingVersion = "REPLICA" | "AUTHENTIC" | "STOCK_PRO" | "PLAYER_ISSUE" | "OTHER";

export interface ListingTraits {
  version: ListingVersion;
  longSleeve: boolean;
  women: boolean;
  bundle: boolean;
  /** Floqué (nom et numéro de joueur) : prix sans rapport avec le maillot nu. */
  printed: boolean;
}

// Termes comparés en mots entiers sur le titre normalisé (minuscules, sans
// accents, ponctuation remplacée par des espaces sauf "/").
const VERSION_TERMS: { version: Exclude<ListingVersion, "REPLICA">; terms: string[] }[] = [
  { version: "PLAYER_ISSUE", terms: ["player issue", "player issued", "match issue", "issued to player"] },
  { version: "STOCK_PRO", terms: ["stock pro", "pro stock"] },
  {
    version: "AUTHENTIC",
    terms: [
      "authentic",
      "player version",
      "players version",
      "player edition",
      "version joueur",
      "version player",
      "spielerversion",
      "spieler version",
      "versione giocatore",
      "version jugador",
      "match version",
      "dri fit adv",
      "vapor",
      "vaporknit",
      "heat rdy",
    ],
  },
  { version: "OTHER", terms: ["match day", "matchday", "match prepared"] },
];

const LONG_SLEEVE_TERMS = [
  "ls",
  "l/s",
  "long sleeve",
  "long sleeves",
  "longsleeve",
  "manches longues",
  "manche longue",
  "langarm",
  "manica lunga",
  "maniche lunghe",
  "manga larga",
  "mangas largas",
];

const WOMEN_TERMS = ["women", "womens", "woman", "ladies", "lady", "femme", "femmes", "damen", "donna", "mujer"];

const BUNDLE_TERMS = ["with short", "with shorts", "full kit", "kit complet"];

const PRINTED_TERMS = ["nameset", "name set", "flocage", "floque", "flocked", "printed", "personalised", "personalized"];

// Numéro de joueur "#10" ou "# 10", lu sur le titre brut (le "#" disparaît à la normalisation).
const SHIRT_NUMBER_RE = /#\s?\d{1,2}\b/;

// Garanties d'authenticité des vendeurs eBay ("100% authentic") : pas une version joueur.
const AUTHENTICITY_CLAIMS = ["100 authentic", "authentic genuine", "genuine authentic"];

function normalize(title: string): string {
  return title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, " ")
    .trim();
}

function hasTerm(padded: string, terms: string[]): boolean {
  return terms.some((term) => padded.includes(` ${term} `));
}

export function listingTraits(title: string): ListingTraits {
  let padded = ` ${normalize(title)} `;
  for (const claim of AUTHENTICITY_CLAIMS) padded = padded.replaceAll(` ${claim} `, " ");

  const version = VERSION_TERMS.find(({ terms }) => hasTerm(padded, terms))?.version ?? "REPLICA";

  return {
    version,
    longSleeve: hasTerm(padded, LONG_SLEEVE_TERMS),
    women: hasTerm(padded, WOMEN_TERMS),
    bundle: hasTerm(padded, BUNDLE_TERMS),
    printed: SHIRT_NUMBER_RE.test(title) || hasTerm(padded, PRINTED_TERMS),
  };
}

export function isReferenceListing(traits: ListingTraits): boolean {
  return (
    traits.version === "REPLICA" && !traits.longSleeve && !traits.women && !traits.bundle && !traits.printed
  );
}
