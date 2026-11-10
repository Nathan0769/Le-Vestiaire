import { buildCfsAffiliateUrl } from "@/lib/cfs-affiliate";
import { parseCfsClub } from "@/lib/cfs-name-parser";
import { cfsSitePrices } from "@/lib/cfs-price";
import { getRatesToEur } from "@/lib/fx";
import { CFS_API_KEY, CFS_BROWSE_BASE, normalizeCfsItem, type CfsRawItem } from "@/lib/cfs-constructor";

/**
 * Promos CFS de la home : maillots de la liquidation CFS (facette `department`),
 * lus uniquement par l'API Constructor.
 *
 * Avant le 2026-11-10, le stock était vérifié en ouvrant chaque page produit dans
 * Chromium (Puppeteer), et les « weekly deals » découverts de la même façon. CFS
 * met ces pages derrière Cloudflare, qui bloque les IP de Vercel : le cron tombait
 * ou ne trouvait rien. Le stock se lit désormais taille par taille dans l'API
 * (`show_hidden_fields`, voir `normalizeCfsItem`), comme pour les dispos.
 */
const CFS_CLEARANCE_PATH = "department/Clearance";
const PAGE_SIZE = 200;
const MAX_PAGES = 50;
const JERSEY_STYLES = ["Home", "Away", "Third", "Fourth", "GK"];
const ADULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
const TARGET_SIZES = new Set(["S", "M", "L", "XL"]);
const MIN_DISCOUNT_PCT = 20;
const MIN_TARGET_SIZES = 2;
const MIN_POPULARITY_SCORE = 30;
const MAX_PER_TEAM = 2;
/**
 * En dessous, on garde les promos déjà en base : un passage raté (CFS en panne,
 * clé changée) ne doit pas vider le bloc de la home.
 */
export const MIN_PROMOS_TO_REPLACE = 6;

export interface CfsScrapedPromo {
  name: string;
  imageUrl: string;
  price: number;
  promoPrice: number;
  affiliateUrl: string;
  club: string | null;
  brand: string | null;
  source: "clearance";
  sizes: string[];
  discountPct: number;
  popularityScore: number;
}

export type CfsPromoRawItem = CfsRawItem & { data: { brand?: string | null } };

// ─── Popularity scoring ────────────────────────────────────────────────────

const POPULARITY_KEYWORDS: Array<{ terms: string[]; score: number }> = [
  {
    score: 100,
    terms: [
      "real madrid", "barcelona", "manchester city", "manchester united",
      "liverpool", "arsenal", "chelsea", "tottenham", "psg", "paris saint-germain",
      "paris saint germain", "bayern", "juventus", "ac milan", "inter milan",
      "borussia dortmund", "atletico madrid", "ajax",
      "france", "brazil", "argentina", "germany", "spain", "italy",
      "england", "portugal", "netherlands",
    ],
  },
  {
    score: 70,
    terms: [
      "napoli", "roma", "lazio", "atalanta", "fiorentina",
      "olympique marseille", "marseille", "lyon", "monaco", "lille", "lens",
      "aston villa", "newcastle", "west ham", "everton", "leeds",
      "sevilla", "valencia", "real betis", "athletic",
      "eintracht frankfurt", "rb leipzig", "bayer leverkusen", "wolfsburg",
      "benfica", "porto", "sporting",
      "celtic", "rangers",
      "galatasaray", "fenerbahce", "besiktas",
      "feyenoord", "psv",
      "flamengo", "boca juniors", "river plate",
      "inter miami", "la galaxy",
      "belgium", "mexico", "japan", "south korea", "morocco", "senegal",
      "cameroon", "colombia", "uruguay", "croatia", "sweden", "denmark",
      "wales", "scotland", "usa", "austria", "switzerland",
      "australia", "nigeria", "ivory coast", "ghana", "iran", "turkey",
    ],
  },
  {
    score: 40,
    terms: [
      "st pauli", "wrexham", "burnley", "espanyol", "sampdoria", "palermo",
      "torino", "bologna", "cagliari", "genoa", "parma",
      "hoffenheim", "freiburg", "stuttgart", "hamburg",
      "rennes", "nantes", "nice", "strasbourg",
      "fulham", "leicester", "wolves", "wolverhampton", "brighton",
      "real sociedad", "osasuna", "girona",
      "rb salzburg", "anderlecht", "club brugge",
      "corinthians", "santos", "fluminense",
      "al nassr", "al hilal",
      "greece", "russia", "poland", "czech", "hungary", "romania",
      "ukraine", "serbia", "norway", "finland",
      "jamaica", "costa rica",
    ],
  },
];

function getPopularityScore(name: string): number {
  const lower = name.toLowerCase();
  for (const tier of POPULARITY_KEYWORDS) {
    if (tier.terms.some((t) => lower.includes(t))) return tier.score;
  }
  return 0;
}

const EXCLUDE_TERMS = [
  "polo", "template", "t-shirt", "pre-match", "training",
  "women", "womens", "woman", " gk ", "(kids)", "kids)",
];

function isAdultJerseyName(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes("shirt") && !EXCLUDE_TERMS.some((t) => lower.includes(t));
}

// Clé d'équipe pour le plafond par équipe : 2 mots du club au plus, ce qui couvre
// les noms de collaboration ("KidSuper CWC") placés avant le descripteur.
function teamKey(name: string): string {
  return (parseCfsClub(name) ?? "").toLowerCase().split(/\s+/).filter(Boolean).slice(0, 2).join(" ") || name;
}

/** Sélection pure : filtre, trie (popularité puis remise), plafonne par équipe. */
export function selectCfsPromos(items: CfsPromoRawItem[], gbpToEur: number, maxResults: number): CfsScrapedPromo[] {
  const seen = new Set<string>();
  const candidates: CfsScrapedPromo[] = [];

  for (const raw of items) {
    const item = normalizeCfsItem(raw);
    if (item.price === null || item.promoPrice === null || !item.imageUrl) continue;
    if (!isAdultJerseyName(item.name)) continue;

    // Prix affichés par le site, pas les euros de l'API (plus chers, voir lib/cfs-price.ts).
    const { price, promoPrice } = cfsSitePrices({ ...item, price: item.price }, gbpToEur);
    if (promoPrice === null) continue;
    const discountPct = Math.round(((price - promoPrice) / price) * 100);
    if (discountPct < MIN_DISCOUNT_PCT) continue;

    const popularityScore = getPopularityScore(item.name);
    if (popularityScore < MIN_POPULARITY_SCORE) continue;

    const sizes = item.inStockSizes;
    if (sizes.filter((s) => TARGET_SIZES.has(s)).length < MIN_TARGET_SIZES) continue;

    const normalized = item.name.replace(/\s*-\s*\d+\/10$/, "").trim();
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    candidates.push({
      name: item.name,
      imageUrl: item.imageUrl,
      price,
      promoPrice,
      affiliateUrl: buildCfsAffiliateUrl(item.url),
      club: parseCfsClub(item.name),
      brand: raw.data.brand ?? null,
      source: "clearance",
      sizes,
      discountPct,
      popularityScore,
    });
  }

  candidates.sort((a, b) =>
    b.popularityScore !== a.popularityScore ? b.popularityScore - a.popularityScore : b.discountPct - a.discountPct
  );

  const perTeam = new Map<string, number>();
  const promos: CfsScrapedPromo[] = [];
  for (const c of candidates) {
    if (promos.length >= maxResults) break;
    const key = teamKey(c.name);
    const count = perTeam.get(key) ?? 0;
    if (count >= MAX_PER_TEAM) continue;
    perTeam.set(key, count + 1);
    promos.push(c);
  }
  return promos;
}

export function buildClearanceUrl(page: number): string {
  const url = new URL(`${CFS_BROWSE_BASE}/${CFS_CLEARANCE_PATH}`);
  url.searchParams.set("key", CFS_API_KEY);
  url.searchParams.set("num_results_per_page", String(PAGE_SIZE));
  url.searchParams.set("page", String(page));
  // Le stock par taille n'est renvoyé qu'avec ce champ caché.
  url.searchParams.set("fmt_options[show_hidden_fields]", "true");
  for (const style of JERSEY_STYLES) url.searchParams.append("filters[product_style]", style);
  for (const size of ADULT_SIZES) url.searchParams.append("filters[size_product]", size);
  return url.toString();
}

async function fetchClearance(fetchImpl: (url: string) => Promise<Response>): Promise<CfsPromoRawItem[]> {
  const items: CfsPromoRawItem[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetchImpl(buildClearanceUrl(page));
    if (!res.ok) throw new Error(`CFS clearance page ${page} : HTTP ${res.status}`);
    const body = (await res.json()) as { response?: { results?: CfsPromoRawItem[] } };
    const results = body.response?.results ?? [];
    items.push(...results);
    if (results.length < PAGE_SIZE) break;
  }
  return items;
}

export async function scrapeCfsPromos(opts?: {
  maxResults?: number;
  fetchImpl?: (url: string) => Promise<Response>;
}): Promise<CfsScrapedPromo[]> {
  const items = await fetchClearance(opts?.fetchImpl ?? ((url) => fetch(url, { signal: AbortSignal.timeout(15_000) })));
  const { GBP: gbpToEur } = await getRatesToEur();
  return selectCfsPromos(items, gbpToEur, opts?.maxResults ?? 20);
}
