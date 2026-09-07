import axios from "axios";
import pLimit from "p-limit";
import prisma from "@/lib/prisma";
import { parseCfsSeason, parseCfsType } from "@/lib/cfs-name-parser";

// Concurrency caps: network is the bottleneck, DB writes share the Prisma pool.
const CLUB_FETCH_CONCURRENCY = 6;
const UPSERT_CONCURRENCY = 8;

const CFS_API_KEY = "key_8uhN6ajd7mHKd4K3";
const CFS_BROWSE_URL = "https://ac.cnstrc.com/browse/group_id";
const CFS_SEARCH_URL = "https://ac.cnstrc.com/search";
const AFFILIATE_PARAMS =
  "ref=mgi4mta&utm_source=Affiliates&utm_medium=referral&utm_campaign=Tapfiliate";
const STALE_THRESHOLD_HOURS = 48;

const ADULT_SIZES = new Set(["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"]);
const TARGET_SIZES = new Set(["S", "M", "L", "XL"]);
const MIN_TARGET_SIZES = 1;

const JERSEY_EXCLUDE_TERMS = [
  "polo",
  "template",
  "t-shirt",
  "pre-match",
  "training shirt",
  "women",
  "womens",
  "woman",
  " gk ",
  "shorts",
  "short ",
  "sock",
  "jacket",
  "hoodie",
  "sweatshirt",
  "tracksuit",
  "track suit",
  "sponsor",
  "patch",
  "flock",
  "print",
  "scarf",
  "cap",
  "bag",
  "mug",
  "poster",
];

interface ConstructorVariation {
  // Constructor.io returns numeric sizes (e.g. 10, 12) as JS numbers, not strings
  data: { size_product?: string | number };
}

interface ConstructorItem {
  data: {
    name: string;
    url: string;
    image_url?: string;
    price_eur?: number;
    special_price_eur?: number;
  };
  variations?: ConstructorVariation[];
}

function isAdultJerseyInStock(item: ConstructorItem): boolean {
  const name = item.data.name.toLowerCase();
  if (!name.includes("shirt")) return false;
  if (name.includes("(kids)") || name.includes("kids)")) return false;
  if (JERSEY_EXCLUDE_TERMS.some((t) => name.includes(t))) return false;
  const variations = item.variations ?? [];

  // Vintage single-piece items have no variations; size is embedded in the name like "(XL)"
  if (variations.length === 0) {
    const sizeMatch = item.data.name.match(/\(([A-Z0-9]+)\)\s*$/);
    if (!sizeMatch) return false;
    const size = sizeMatch[1].toUpperCase();
    return ADULT_SIZES.has(size);
  }

  const adultVariations = variations.filter((v) =>
    ADULT_SIZES.has(String(v.data.size_product ?? "").toUpperCase())
  );
  if (adultVariations.length === 0) return false;
  const targetCount = adultVariations.filter((v) =>
    TARGET_SIZES.has(String(v.data.size_product ?? "").toUpperCase())
  ).length;
  return targetCount >= MIN_TARGET_SIZES;
}

interface ScrapeStats {
  clubsScanned: number;
  clubsSkipped: string[];
  productsSeen: number;
  matched: number;
  upserted: number;
  purged: number;
}

async function fetchClubProducts(slug: string): Promise<ConstructorItem[]> {
  const all: ConstructorItem[] = [];
  let page = 1;
  while (true) {
    const url = `${CFS_BROWSE_URL}/${slug}?key=${CFS_API_KEY}&num_results_per_page=200&page=${page}`;
    const res = await axios.get(url, { timeout: 15000 });
    const results: ConstructorItem[] = res.data.response.results ?? [];
    const total: number = res.data.response.total_num_results ?? 0;
    all.push(...results);
    if (all.length >= total || results.length === 0) break;
    page++;
    if (page > 20) break;
  }
  return all;
}

async function fetchClubBySearch(clubName: string): Promise<ConstructorItem[]> {
  const query = encodeURIComponent(`${clubName} shirt`);
  const all: ConstructorItem[] = [];
  let page = 1;
  const namePrefix = clubName.toLowerCase();
  while (true) {
    // No filter: some Arsenal shirts have only `price-drops` as group_id.
    // We rely on the name prefix filter below + isAdultJerseyInStock later.
    const url = `${CFS_SEARCH_URL}/${query}?key=${CFS_API_KEY}&num_results_per_page=200&page=${page}`;
    const res = await axios.get(url, { timeout: 15000 });
    const results: ConstructorItem[] = res.data.response.results ?? [];
    const total: number = res.data.response.total_num_results ?? 0;
    // Only keep products whose name starts with a season followed by the club name
    const filtered = results.filter((item) => {
      const lower = item.data.name.toLowerCase();
      const withoutYear = lower.replace(/^\d{4}(?:-\d{2})?\s+/, "");
      return withoutYear.startsWith(namePrefix);
    });
    all.push(...filtered);
    if (results.length === 0 || page * 200 >= total) break;
    page++;
    if (page > 15) break;
  }
  return all;
}

function buildAffiliateUrl(productUrl: string): string {
  const sep = productUrl.includes("?") ? "&" : "?";
  return `${productUrl}${sep}${AFFILIATE_PARAMS}`;
}

interface ClubLookup {
  slugs: string[];
  searchNames: string[];
}

async function loadReverseAliasMap(): Promise<Map<string, ClubLookup>> {
  const aliases = await prisma.cfsClubAlias.findMany({
    select: { cfsName: true, clubId: true },
  });
  const map = new Map<string, ClubLookup>();
  for (const a of aliases) {
    const slug = a.cfsName.toLowerCase().replace(/\s+/g, "-");
    const existing = map.get(a.clubId) ?? { slugs: [], searchNames: [] };
    if (!existing.slugs.includes(slug)) existing.slugs.push(slug);
    if (!existing.searchNames.includes(a.cfsName)) existing.searchNames.push(a.cfsName);
    map.set(a.clubId, existing);
  }
  return map;
}

interface CfsAvailabilityUpsertData {
  price: number;
  promoPrice: number | null;
  productUrl: string;
  affiliateUrl: string;
  imageUrl: string;
}

// One query for all wishlisted clubs; keep the lowest variant per
// (club, season, type) to mirror the old findFirst(orderBy: variant asc).
async function buildJerseyIndex(
  clubIds: string[]
): Promise<Map<string, string>> {
  const jerseys = await prisma.jersey.findMany({
    where: { clubId: { in: clubIds } },
    orderBy: { variant: "asc" },
    select: { id: true, clubId: true, season: true, type: true },
  });
  const index = new Map<string, string>();
  for (const j of jerseys) {
    const key = `${j.clubId}|${j.season}|${j.type}`;
    if (!index.has(key)) index.set(key, j.id);
  }
  return index;
}

async function fetchClubProductsWithFallback(
  clubId: string,
  lookup: ClubLookup | undefined
): Promise<ConstructorItem[]> {
  const slugs = [...(lookup?.slugs ?? [])];
  if (!slugs.includes(clubId)) slugs.push(clubId);

  for (const slug of slugs) {
    try {
      const found = await fetchClubProducts(slug);
      if (found.length > 0) return found;
    } catch {
      // Try next slug
    }
  }

  // Fallback: search when browse returned 0 (some clubs like Arsenal have no group_id on CFS)
  for (const name of lookup?.searchNames ?? []) {
    try {
      const found = await fetchClubBySearch(name);
      if (found.length > 0) return found;
    } catch {
      // Try next name
    }
  }

  return [];
}

export async function scrapeCfsAvailability(): Promise<ScrapeStats> {
  const stats: ScrapeStats = {
    clubsScanned: 0,
    clubsSkipped: [],
    productsSeen: 0,
    matched: 0,
    upserted: 0,
    purged: 0,
  };

  const wishlistedClubs = await prisma.wishlist.findMany({
    distinct: ["jerseyId"],
    select: { jersey: { select: { clubId: true } } },
  });
  const clubIds = Array.from(
    new Set(wishlistedClubs.map((w) => w.jersey.clubId))
  );

  if (clubIds.length === 0) return stats;

  // Load the alias map and prebuild a (clubId|season|type) -> jerseyId index in
  // one query, so matching later is pure in-memory lookups instead of a
  // findFirst per product.
  const [reverseAliasMap, jerseyIndex] = await Promise.all([
    loadReverseAliasMap(),
    buildJerseyIndex(clubIds),
  ]);

  // Phase 1: fetch every club's products concurrently. Network is the
  // bottleneck, so a bounded pool collapses the serial per-club waits.
  const fetchLimit = pLimit(CLUB_FETCH_CONCURRENCY);
  const clubResults = await Promise.all(
    clubIds.map((clubId) =>
      fetchLimit(async () => ({
        clubId,
        products: await fetchClubProductsWithFallback(
          clubId,
          reverseAliasMap.get(clubId)
        ),
      }))
    )
  );

  // Phase 2: match products against the in-memory index (no I/O). Dedupe by
  // jerseyId, last match wins, matching the original sequential semantics and
  // avoiding concurrent upserts racing on the same unique row.
  const now = new Date();
  const matches = new Map<string, CfsAvailabilityUpsertData>();
  for (const { clubId, products } of clubResults) {
    if (products.length === 0) {
      stats.clubsSkipped.push(clubId);
      continue;
    }

    stats.clubsScanned++;
    stats.productsSeen += products.length;

    for (const item of products) {
      if (!isAdultJerseyInStock(item)) continue;

      const price = item.data.price_eur;
      if (!price) continue;
      const imageUrl = item.data.image_url;
      if (!imageUrl) continue;

      const season = parseCfsSeason(item.data.name);
      const type = parseCfsType(item.data.name);
      if (!season || !type) continue;

      const jerseyId = jerseyIndex.get(`${clubId}|${season}|${type}`);
      if (!jerseyId) continue;

      stats.matched++;

      const promoPrice = item.data.special_price_eur;
      matches.set(jerseyId, {
        price,
        promoPrice: promoPrice && promoPrice < price ? promoPrice : null,
        productUrl: item.data.url,
        affiliateUrl: buildAffiliateUrl(item.data.url),
        imageUrl,
      });
    }
  }

  // Phase 3: write matches concurrently, bounded to the Prisma pool.
  const upsertLimit = pLimit(UPSERT_CONCURRENCY);
  await Promise.all(
    Array.from(matches.entries()).map(([jerseyId, data]) =>
      upsertLimit(() =>
        prisma.cfsAvailability.upsert({
          where: { jerseyId },
          create: { jerseyId, ...data },
          update: { ...data, lastSeenAt: now },
        })
      )
    )
  );
  stats.upserted = matches.size;

  const staleThreshold = new Date(
    Date.now() - STALE_THRESHOLD_HOURS * 60 * 60 * 1000
  );
  const purged = await prisma.cfsAvailability.deleteMany({
    where: { lastSeenAt: { lt: staleThreshold } },
  });
  stats.purged = purged.count;

  return stats;
}
