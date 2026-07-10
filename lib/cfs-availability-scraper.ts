import axios from "axios";
import prisma from "@/lib/prisma";
import { parseCfsSeason, parseCfsType } from "@/lib/cfs-name-parser";

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
  data: { size_product?: string };
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
    ADULT_SIZES.has((v.data.size_product ?? "").toUpperCase())
  );
  if (adultVariations.length === 0) return false;
  const targetCount = adultVariations.filter((v) =>
    TARGET_SIZES.has((v.data.size_product ?? "").toUpperCase())
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

  const reverseAliasMap = await loadReverseAliasMap();

  for (const clubId of clubIds) {
    const lookup = reverseAliasMap.get(clubId) ?? {
      slugs: [],
      searchNames: [],
    };
    const slugs = [...lookup.slugs];
    if (!slugs.includes(clubId)) slugs.push(clubId);

    let products: ConstructorItem[] = [];
    for (const slug of slugs) {
      try {
        const found = await fetchClubProducts(slug);
        if (found.length > 0) {
          products = found;
          break;
        }
      } catch {
        // Try next slug
      }
    }

    // Fallback: search when browse returned 0 (some clubs like Arsenal have no group_id on CFS)
    if (products.length === 0) {
      const searchNames = lookup.searchNames.length > 0 ? lookup.searchNames : [];
      for (const name of searchNames) {
        try {
          const found = await fetchClubBySearch(name);
          if (found.length > 0) {
            products = found;
            break;
          }
        } catch {
          // Try next name
        }
      }
    }

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
      const promoPrice = item.data.special_price_eur;
      const imageUrl = item.data.image_url;
      if (!imageUrl) continue;

      const season = parseCfsSeason(item.data.name);
      const type = parseCfsType(item.data.name);
      if (!season || !type) continue;

      const jersey = await prisma.jersey.findFirst({
        where: { clubId, season, type },
        orderBy: { variant: "asc" },
        select: { id: true },
      });
      if (!jersey) continue;

      stats.matched++;

      await prisma.cfsAvailability.upsert({
        where: { jerseyId: jersey.id },
        create: {
          jerseyId: jersey.id,
          price,
          promoPrice:
            promoPrice && promoPrice < price ? promoPrice : null,
          productUrl: item.data.url,
          affiliateUrl: buildAffiliateUrl(item.data.url),
          imageUrl,
        },
        update: {
          price,
          promoPrice:
            promoPrice && promoPrice < price ? promoPrice : null,
          productUrl: item.data.url,
          affiliateUrl: buildAffiliateUrl(item.data.url),
          imageUrl,
          lastSeenAt: new Date(),
        },
      });
      stats.upserted++;
    }
  }

  const staleThreshold = new Date(
    Date.now() - STALE_THRESHOLD_HOURS * 60 * 60 * 1000
  );
  const purged = await prisma.cfsAvailability.deleteMany({
    where: { lastSeenAt: { lt: staleThreshold } },
  });
  stats.purged = purged.count;

  return stats;
}
