import axios from "axios";
import type { Browser } from "puppeteer-core";

const CFS_API_KEY = "key_8uhN6ajd7mHKd4K3";
const CFS_BROWSE_URL = "https://ac.cnstrc.com/browse/group_id";
const AFFILIATE_PARAMS =
  "ref=mgi4mta&utm_source=Affiliates&utm_medium=referral&utm_campaign=Tapfiliate";

const ADULT_SIZES = new Set(["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"]);
const TARGET_SIZES = new Set(["S", "M", "L", "XL"]);
const MIN_DISCOUNT_PCT = 20;
const MIN_TARGET_SIZES = 2;
const MIN_POPULARITY_SCORE = 30;
// Fetch more candidates than needed to account for size filter losses
const CANDIDATES_MULTIPLIER = 6;

export interface CfsScrapedPromo {
  name: string;
  imageUrl: string;
  price: number;
  promoPrice: number;
  affiliateUrl: string;
  club: string | null;
  brand: string | null;
  source: "clearance" | "cfs-weekly-deals";
  sizes: string[];
  discountPct: number;
  popularityScore: number;
}

interface ConstructorVariation {
  data: { size_product?: string };
}

interface ConstructorItem {
  data: {
    name: string;
    url: string;
    image_url?: string;
    price_eur?: number;
    special_price_eur?: number;
    brand?: string;
    group_ids?: string[];
  };
  variations?: ConstructorVariation[];
}

interface Candidate {
  name: string;
  imageUrl: string;
  price: number;
  promoPrice: number;
  productUrl: string;
  club: string | null;
  brand: string | null;
  source: "clearance" | "cfs-weekly-deals";
  discountPct: number;
  popularityScore: number;
}

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

// ─── API filtering ─────────────────────────────────────────────────────────

const JERSEY_EXCLUDE_TERMS = [
  "polo", "template", "t-shirt", "pre-match", "training shirt",
  "women", "womens", "woman", " gk ",
];

function isAdultJersey(item: ConstructorItem): boolean {
  const name = item.data.name.toLowerCase();
  if (!name.includes("shirt")) return false;
  if (name.includes("(kids)") || name.includes("kids)")) return false;
  if (JERSEY_EXCLUDE_TERMS.some((t) => name.includes(t))) return false;
  return (item.variations ?? []).some((v) =>
    ADULT_SIZES.has(v.data.size_product ?? "")
  );
}

function buildAffiliateUrl(productUrl: string): string {
  const sep = productUrl.includes("?") ? "&" : "?";
  return `${productUrl}${sep}${AFFILIATE_PARAMS}`;
}

function extractClub(groupIds: string[] | undefined): string | null {
  if (!groupIds?.length) return null;
  const excluded = new Set([
    "clearance", "cfs-weekly-deals", "price-drops", "kids",
    "new-products", "all-football-shirts", "warehouse-clearance",
    "new-clearance", "limited-warehouse-clearance", "best-sellers",
    "trending", "winter-sale", "hold", "social-spotlight",
  ]);
  const club = groupIds.find((id) => !excluded.has(id));
  if (!club) return null;
  return club.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

async function fetchPage(groupId: string, page: number): Promise<{ results: ConstructorItem[]; total: number }> {
  const url = `${CFS_BROWSE_URL}/${groupId}?key=${CFS_API_KEY}&num_results_per_page=100&page=${page}`;
  const res = await axios.get(url, { timeout: 15000 });
  return { results: res.data.response.results ?? [], total: res.data.response.total_num_results ?? 0 };
}

async function fetchAllPages(groupId: string): Promise<ConstructorItem[]> {
  const first = await fetchPage(groupId, 1);
  const totalPages = Math.ceil(first.total / 100);
  const remaining = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  const all = [...first.results];
  for (let i = 0; i < remaining.length; i += 5) {
    const batch = remaining.slice(i, i + 5);
    const results = await Promise.all(batch.map((p) => fetchPage(groupId, p)));
    results.forEach((r) => all.push(...r.results));
  }
  return all;
}

function toCandidate(item: ConstructorItem, source: "clearance" | "cfs-weekly-deals"): Candidate | null {
  const price = item.data.price_eur;
  const promoPrice = item.data.special_price_eur;
  if (!price || !promoPrice) return null;

  const discountPct = Math.round(((price - promoPrice) / price) * 100);
  if (discountPct < MIN_DISCOUNT_PCT) return null;
  if (!isAdultJersey(item)) return null;

  const popularityScore = getPopularityScore(item.data.name);
  if (popularityScore < MIN_POPULARITY_SCORE) return null;

  const imageUrl = item.data.image_url;
  if (!imageUrl) return null;

  return {
    name: item.data.name,
    imageUrl,
    price,
    promoPrice,
    productUrl: item.data.url,
    club: extractClub(item.data.group_ids),
    brand: item.data.brand ?? null,
    source,
    discountPct,
    popularityScore,
  };
}

// ─── Puppeteer size checking ───────────────────────────────────────────────

export function parseInStockSizes(html: string): string[] {
  // Primary: "options" array directly lists available (in-stock) size labels.
  // Format: "label":"S","products":["variantId"]
  // CFS sets yShowOutOfStockStatus:false so options only contains in-stock variants.
  const sizes: string[] = [];
  for (const [, label] of html.matchAll(/"label":"([^"]+)","products":\[/g)) {
    const size = label.toUpperCase();
    if (ADULT_SIZES.has(size) && !sizes.includes(size)) sizes.push(size);
  }
  if (sizes.length > 0) return sizes;

  // Fallback: quantities (varId→qty) + sku (varId→"CODE-SIZE"), filter qty > 0
  const qMatch = html.match(/"quantities":\{([^}]+)\}/);
  const sMatch = html.match(/"sku":\{([^}]+)\}/);
  if (!qMatch || !sMatch) return [];

  const inStockIds = new Set(
    [...qMatch[1].matchAll(/"(\d+)":(\d+)/g)]
      .filter(([, , qty]) => parseInt(qty) > 0)
      .map(([, id]) => id)
  );

  for (const [, id, sku] of sMatch[1].matchAll(/"(\d+)":"([^"]+)"/g)) {
    if (!inStockIds.has(id)) continue;
    const parts = sku.split("-");
    const size = parts[parts.length - 1].toUpperCase();
    if (ADULT_SIZES.has(size) && !sizes.includes(size)) sizes.push(size);
  }
  return sizes;
}

async function checkSizesInBatch(
  candidates: Candidate[],
  browser: Browser,
  concurrency = 4
): Promise<Array<Candidate & { sizes: string[] }>> {
  const results: Array<Candidate & { sizes: string[] }> = [];

  for (let i = 0; i < candidates.length; i += concurrency) {
    const batch = candidates.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (candidate) => {
        const page = await browser.newPage();
        try {
          await page.setUserAgent(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          );
          await page.goto(candidate.productUrl, {
            waitUntil: "domcontentloaded",
            timeout: 20000,
          });
          // Wait for product config to be injected
          await page.waitForFunction(
            () => document.documentElement.innerHTML.includes('"quantities"'),
            { timeout: 10000 }
          ).catch(() => {});

          const html = await page.content();
          const sizes = parseInStockSizes(html);
          return { ...candidate, sizes };
        } catch {
          return { ...candidate, sizes: [] };
        } finally {
          await page.close();
        }
      })
    );
    results.push(...batchResults);
    process.stdout.write(`  Checked ${Math.min(i + concurrency, candidates.length)}/${candidates.length} products\r`);
  }
  console.log();
  return results;
}

// ─── Main export ───────────────────────────────────────────────────────────

export async function scrapeCfsPromos(opts?: {
  maxResults?: number;
}): Promise<CfsScrapedPromo[]> {
  const maxResults = opts?.maxResults ?? 20;
  const candidatesNeeded = maxResults * CANDIDATES_MULTIPLIER;

  console.log("Fetching clearance products...");
  const clearanceItems = await fetchAllPages("clearance");
  console.log(`  Fetched ${clearanceItems.length} clearance items`);

  console.log("Fetching weekly deals...");
  const weeklyItems = await fetchAllPages("cfs-weekly-deals");
  console.log(`  Fetched ${weeklyItems.length} weekly deal items`);

  // Weekly deals first so they win deduplication
  const allItems = [
    ...weeklyItems.map((item) => ({ item, source: "cfs-weekly-deals" as const })),
    ...clearanceItems.map((item) => ({ item, source: "clearance" as const })),
  ];

  const candidates: Candidate[] = [];
  const seenNames = new Set<string>();

  for (const { item, source } of allItems) {
    const candidate = toCandidate(item, source);
    if (!candidate) continue;
    const normalized = candidate.name.replace(/\s*-\s*\d+\/10$/, "").trim();
    if (seenNames.has(normalized)) continue;
    seenNames.add(normalized);
    candidates.push(candidate);
  }

  // Sort and take top candidates for size checking
  candidates.sort((a, b) =>
    b.popularityScore !== a.popularityScore
      ? b.popularityScore - a.popularityScore
      : b.discountPct - a.discountPct
  );

  const topCandidates = candidates.slice(0, candidatesNeeded);
  console.log(`  ${candidates.length} candidates after API filter`);
  console.log(`  Checking real stock for top ${topCandidates.length}...`);

  const isDev = process.env.NODE_ENV !== "production";
  let browser: Browser;
  if (isDev) {
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
  } else {
    const puppeteerCore = await import("puppeteer-core");
    const chromium = await import("@sparticuz/chromium");
    browser = await puppeteerCore.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });
  }

  let verified: Array<Candidate & { sizes: string[] }> = [];
  try {
    verified = await checkSizesInBatch(topCandidates, browser);
  } finally {
    await browser.close();
  }

  const MAX_PER_TEAM = 2;
  const teamCounts = new Map<string, number>();
  const promos: CfsScrapedPromo[] = [];

  for (const c of verified) {
    if (promos.length >= maxResults) break;
    const targetCount = c.sizes.filter((s) => TARGET_SIZES.has(s)).length;
    if (targetCount < MIN_TARGET_SIZES) continue;

    // Extract team by cutting at the first jersey descriptor, then keep max 2 words.
    // Max-2-words handles collaboration names like "KidSuper CWC" inserted before the descriptor.
    const nameWithoutYear = c.name.replace(/^\d{4}(?:-\d{2})?\s+/, "");
    const cutAt = nameWithoutYear.search(
      /\b(?:\d+(?:st|nd|rd|th)|Authentic|Home|Away|Third|Fourth|Goalkeeper|GK|Player Issue|L\/S|In Box|Shirt|Kit|Puma|Nike|Adidas|Umbro|New Balance|Kappa|Castore|Hummel|Macron)\b/i
    );
    const raw = (cutAt > 0 ? nameWithoutYear.slice(0, cutAt) : nameWithoutYear).trim().toLowerCase();
    const teamKey = raw.split(/\s+/).slice(0, 2).join(" ") || c.club?.toLowerCase() || "unknown";

    const count = teamCounts.get(teamKey) ?? 0;
    if (count >= MAX_PER_TEAM) continue;
    teamCounts.set(teamKey, count + 1);

    promos.push({
      name: c.name,
      imageUrl: c.imageUrl,
      price: c.price,
      promoPrice: c.promoPrice,
      affiliateUrl: buildAffiliateUrl(c.productUrl),
      club: c.club,
      brand: c.brand,
      source: c.source,
      sizes: c.sizes,
      discountPct: c.discountPct,
      popularityScore: c.popularityScore,
    });
  }

  console.log(`  ${promos.length} promos pass real stock check`);
  return promos;
}
