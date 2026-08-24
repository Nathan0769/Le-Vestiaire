import axios from "axios";
import type { Browser } from "puppeteer-core";
import { parseCfsClub } from "@/lib/cfs-name-parser";

const CFS_API_KEY = "key_gafGDajYFUpadvrp";
const CFS_BROWSE_BASE = "https://ac.cnstrc.com/browse";
// CFS migrated its Constructor index (2026): "clearance" is no longer a browsable
// group_id but a value of the `department` facet, so we browse it by filter.
const CFS_CLEARANCE_PATH = "department/Clearance";
// Weekly deals is a curated theme page backed by a Constructor collection whose id
// CFS renames periodically. We discover it at runtime rather than hardcode a slug.
const CFS_WEEKLY_DEALS_URL =
  "https://www.classicfootballshirts.com/theme/cfs-weekly-deals.html";
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
  // CFS Constructor API returns size_product as an array (e.g. ["M"])
  data: { size_product?: string[] };
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
    (v.data.size_product ?? []).some((s) => ADULT_SIZES.has(s))
  );
}

function buildAffiliateUrl(productUrl: string): string {
  const sep = productUrl.includes("?") ? "&" : "?";
  return `${productUrl}${sep}${AFFILIATE_PARAMS}`;
}

// Non-club group_ids: marketing, categories, brands, seasons. Only used as a
// last-resort fallback when the product name yields no club.
const NON_CLUB_GROUP_IDS = new Set([
  "clearance", "new-clearance", "warehouse-clearance", "limited-warehouse-clearance",
  "price-drops", "cfs-weekly-deals", "weekly-deals", "winter-sale", "summer-sale",
  "best-sellers", "trending", "social-spotlight", "hold",
  "football-shirts", "all-football-shirts", "training-shirts", "pre-match-shirts",
  "full-kits", "kids", "legends", "other-world-clubs", "retro-shirts",
  "adidas", "adidas-originals", "nike", "puma", "umbro", "kappa", "castore",
  "hummel", "macron", "charly", "joma", "new-balance", "newbalance", "lotto",
  "errea", "six5six", "le-coq-sportif", "lecoqsportif", "diadora", "kelme",
  "cfs-apparel", "meyba", "legea", "icarus", "fbt", "admiral", "jako", "robey",
]);

function isNonClubGroup(id: string): boolean {
  if (NON_CLUB_GROUP_IDS.has(id)) return true;
  if (/^\d{4}(?:-\d{2})?$/.test(id)) return true; // season, e.g. 2024-25 / 2025
  if (/^new-products\d*$/.test(id)) return true; // new-products, new-products1…
  if (id.includes("collection")) return true; // adidas-2024-trefoil-collection
  return false;
}

function extractClub(name: string, groupIds: string[] | undefined): string | null {
  // Primary: the product name always carries the club with correct casing.
  const fromName = parseCfsClub(name);
  if (fromName) return fromName;

  // Fallback (rare — name had no descriptor): first group_id that isn't a
  // marketing/brand/category/season group.
  const slug = groupIds?.find((id) => !isNonClubGroup(id));
  if (!slug) return null;
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// `browsePath` is the Constructor browse selector, e.g. "department/Clearance"
// (facet filter) or "collection_id/<id>" (curated collection).
async function fetchPage(browsePath: string, page: number): Promise<{ results: ConstructorItem[]; total: number }> {
  const url = `${CFS_BROWSE_BASE}/${browsePath}?key=${CFS_API_KEY}&num_results_per_page=100&page=${page}`;
  const res = await axios.get(url, { timeout: 15000 });
  return { results: res.data.response.results ?? [], total: res.data.response.total_num_results ?? 0 };
}

async function fetchAllPages(browsePath: string): Promise<ConstructorItem[]> {
  const first = await fetchPage(browsePath, 1);
  const totalPages = Math.ceil(first.total / 100);
  const remaining = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  const all = [...first.results];
  for (let i = 0; i < remaining.length; i += 5) {
    const batch = remaining.slice(i, i + 5);
    const results = await Promise.all(batch.map((p) => fetchPage(browsePath, p)));
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
    club: extractClub(item.data.name, item.data.group_ids),
    brand: item.data.brand ?? null,
    source,
    discountPct,
    popularityScore,
  };
}

// ─── Puppeteer size checking ───────────────────────────────────────────────

export function parseInStockSizes(html: string): string[] {
  const sizes: string[] = [];

  // Source of truth: quantities (varId→qty) + sku (varId→"CODE-SIZE"), keep qty > 0.
  // The "options" array is a display list that keeps sold-out sizes, so it over-reports
  // stock. Whenever quantities is present it wins; options is only a last-resort fallback.
  const qMatch = html.match(/"quantities":\{([^}]+)\}/);
  const sMatch = html.match(/"sku":\{([^}]+)\}/);
  if (qMatch && sMatch) {
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

  // Fallback (no quantities blob): "options" array lists size labels.
  // Format: "label":"S","products":["variantId"]
  for (const [, label] of html.matchAll(/"label":"([^"]+)","products":\[/g)) {
    const size = label.toUpperCase();
    if (ADULT_SIZES.has(size) && !sizes.includes(size)) sizes.push(size);
  }
  return sizes;
}

async function checkCandidateSizes(
  candidate: Candidate,
  browser: Browser
): Promise<Candidate & { sizes: string[] }> {
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
    await page
      .waitForFunction(
        () => document.documentElement.innerHTML.includes('"quantities"'),
        { timeout: 10000 }
      )
      .catch(() => {});

    const html = await page.content();
    return { ...candidate, sizes: parseInStockSizes(html) };
  } catch {
    return { ...candidate, sizes: [] };
  } finally {
    await page.close();
  }
}

// Team key used to cap how many jerseys of the same team we surface.
// Keep max 2 words of the club name, which handles collaboration names like
// "KidSuper CWC" inserted before the descriptor.
function extractTeamKey(name: string, club: string | null): string {
  const raw = (parseCfsClub(name) ?? club ?? "").toLowerCase();
  return raw.split(/\s+/).filter(Boolean).slice(0, 2).join(" ") || "unknown";
}

// Verify real stock page-by-page in batches, accepting promos as we go and stopping
// as soon as we have `maxResults`. Candidates are pre-sorted by popularity, so the
// best ones are checked first — this bounds the (slow) Puppeteer work far below the
// full candidate list, keeping the whole run within the serverless time budget.
async function selectAvailablePromos(
  candidates: Candidate[],
  browser: Browser,
  maxResults: number,
  concurrency = 4
): Promise<CfsScrapedPromo[]> {
  const MAX_PER_TEAM = 2;
  // Hard ceiling on pages checked, so a run where few candidates pass still terminates.
  const maxPagesToCheck = maxResults * CANDIDATES_MULTIPLIER;

  const teamCounts = new Map<string, number>();
  const promos: CfsScrapedPromo[] = [];
  let checked = 0;
  let cursor = 0;

  while (
    cursor < candidates.length &&
    promos.length < maxResults &&
    checked < maxPagesToCheck
  ) {
    // Build the next batch, skipping candidates whose team is already full BEFORE
    // loading their page. Clearance has many jerseys per popular team; without this,
    // once a team hits its cap we'd still Puppeteer-check (slowly, behind Cloudflare)
    // every remaining jersey of that team only to reject it.
    const batch: Array<{ candidate: Candidate; teamKey: string }> = [];
    while (batch.length < concurrency && cursor < candidates.length) {
      const candidate = candidates[cursor++];
      const teamKey = extractTeamKey(candidate.name, candidate.club);
      if ((teamCounts.get(teamKey) ?? 0) >= MAX_PER_TEAM) continue;
      batch.push({ candidate, teamKey });
    }
    if (batch.length === 0) break;

    const batchResults = await Promise.all(
      batch.map(({ candidate, teamKey }) =>
        checkCandidateSizes(candidate, browser).then((r) => ({ ...r, teamKey }))
      )
    );
    checked += batch.length;

    for (const c of batchResults) {
      if (promos.length >= maxResults) break;

      const targetCount = c.sizes.filter((s) => TARGET_SIZES.has(s)).length;
      if (targetCount < MIN_TARGET_SIZES) continue;

      // Re-check the cap: two same-team candidates can share a concurrent batch.
      const count = teamCounts.get(c.teamKey) ?? 0;
      if (count >= MAX_PER_TEAM) continue;
      teamCounts.set(c.teamKey, count + 1);

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
    process.stdout.write(
      `  Checked ${checked} pages, ${promos.length}/${maxResults} promos\r`
    );
  }
  console.log();
  return promos;
}

// ─── Weekly deals collection discovery ───────────────────────────────────────

// Constructor browse requests for a collection look like
// `.../browse/collection_id/<id>?...`. Extract that id (empty for facet/search URLs).
export function parseCollectionIdFromUrl(url: string): string | null {
  const m = url.match(/\/browse\/collection_id\/([^/?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function launchBrowser(): Promise<Browser> {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    const puppeteer = await import("puppeteer");
    return puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
  }
  const puppeteerCore = await import("puppeteer-core");
  const chromium = await import("@sparticuz/chromium");
  return puppeteerCore.launch({
    args: chromium.default.args,
    executablePath: await chromium.default.executablePath(),
    headless: true,
  });
}

// The theme page is behind Cloudflare, so plain HTTP fetches are blocked. Real
// Chrome clears the challenge; we load the page and read the collection_id from
// the Constructor browse request it fires, avoiding a hardcoded (and drifting) slug.
async function discoverWeeklyDealsCollectionId(browser: Browser): Promise<string | null> {
  const page = await browser.newPage();
  let collectionId: string | null = null;
  page.on("request", (req) => {
    if (collectionId) return;
    const id = parseCollectionIdFromUrl(req.url());
    if (id) collectionId = id;
  });
  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.goto(CFS_WEEKLY_DEALS_URL, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    return collectionId;
  } catch {
    return collectionId;
  } finally {
    await page.close();
  }
}

// ─── Main export ───────────────────────────────────────────────────────────

export async function scrapeCfsPromos(opts?: {
  maxResults?: number;
}): Promise<CfsScrapedPromo[]> {
  const maxResults = opts?.maxResults ?? 20;

  const browser = await launchBrowser();
  try {
    console.log("Discovering weekly deals collection...");
    const weeklyCollectionId = await discoverWeeklyDealsCollectionId(browser);
    console.log(
      weeklyCollectionId
        ? `  Weekly deals collection: ${weeklyCollectionId}`
        : "  Weekly deals collection not found, using clearance only"
    );

    console.log("Fetching clearance products...");
    const clearanceItems = await fetchAllPages(CFS_CLEARANCE_PATH);
    console.log(`  Fetched ${clearanceItems.length} clearance items`);

    let weeklyItems: ConstructorItem[] = [];
    if (weeklyCollectionId) {
      console.log("Fetching weekly deals...");
      weeklyItems = await fetchAllPages(`collection_id/${weeklyCollectionId}`);
      console.log(`  Fetched ${weeklyItems.length} weekly deal items`);
    }

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

    console.log(`  ${candidates.length} candidates after API filter`);
    console.log(`  Checking real stock (early-exit at ${maxResults} promos)...`);

    const promos = await selectAvailablePromos(candidates, browser, maxResults);
    console.log(`  ${promos.length} promos pass real stock check`);
    return promos;
  } finally {
    await browser.close();
  }
}
