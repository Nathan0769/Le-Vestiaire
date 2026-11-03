import pLimit from "p-limit";
import prisma from "@/lib/prisma";
import { parseCfsSeason, parseCfsType } from "@/lib/cfs-name-parser";
import { fetchCfsTeams, fetchTeamProducts, isAllowedCfsUrl, type CfsItem } from "@/lib/cfs-constructor";
import { isReferenceListing, listingTraits } from "@/lib/market-value/listing-traits";
import { normalizeClubName } from "@/lib/partner-shops/club-name";
import { seasonCandidates } from "@/lib/partner-shops/season-candidates";
import type { Condition } from "@/lib/market-value/types";

/**
 * Dispos CFS de toutes les équipes reliées à un club du catalogue (CfsClubAlias).
 * Spec : docs/specs/2026-11-02-cfs-catalogue-complet.md.
 */

// Le réseau est le goulot ; les écritures partagent le pool Prisma.
const TEAM_FETCH_CONCURRENCY = 6;
const UPSERT_CONCURRENCY = 8;
const AFFILIATE_PARAMS = "ref=mgi4mta&utm_source=Affiliates&utm_medium=referral&utm_campaign=Tapfiliate";
const STALE_THRESHOLD_HOURS = 48;
/** Marge sous le maxDuration de 300 s du cron. */
const DEFAULT_BUDGET_MS = 240_000;
// Au moins une taille courante : une pièce en XS ou 4XL seulement n'intéresse presque personne.
const TARGET_SIZES = new Set(["S", "M", "L", "XL"]);
// Coupe femme : pas un maillot du catalogue (le filtre de l'API ne la distingue pas).
const WOMEN_RE = /\bwom[ae]n'?s?\b/i;

interface ScrapeStats {
  teamsTotal: number;
  teamsScanned: number;
  /** Équipes CFS sans alias vers un club du catalogue. */
  teamsWithoutAlias: number;
  /** Équipes aliasées non parcourues faute de temps. */
  teamsNotReached: string[];
  productsSeen: number;
  matched: number;
  written: number;
  purged: number;
  /** Maillots dont la dispo affichée a changé : fiches ISR à régénérer. */
  changedJerseyIds: string[];
}

interface CfsAvailabilityUpsertData {
  price: number;
  promoPrice: number | null;
  productUrl: string;
  affiliateUrl: string;
  imageUrl: string;
  isReference: boolean;
  condition: Condition | null;
}

type DisplayedOffer = { price: number; promoPrice: number | null; affiliateUrl: string };

/** Dispos apparues, modifiées (prix, promo, lien) ou purgées depuis le dernier scrape. */
export function cfsChangedJerseyIds(
  before: Map<string, DisplayedOffer>,
  after: Map<string, DisplayedOffer>,
  purgedIds: string[]
): string[] {
  const changed = new Set(purgedIds);
  for (const [jerseyId, offer] of after) {
    const old = before.get(jerseyId);
    if (
      !old ||
      old.price !== offer.price ||
      old.promoPrice !== offer.promoPrice ||
      old.affiliateUrl !== offer.affiliateUrl
    ) {
      changed.add(jerseyId);
    }
  }
  return [...changed];
}

const CONDITION_RANK: Record<Condition, number> = { MINT: 4, EXCELLENT: 3, GOOD: 2, FAIR: 1, POOR: 0 };
const conditionRank = (c: Condition | null) => (c ? CONDITION_RANK[c] : -1);

/**
 * Plusieurs produits CFS pour un même maillot : on garde de préférence un
 * maillot supporter manches courtes (le seul qui compte dans la cote), puis le
 * meilleur état. À égalité, le dernier produit vu l'emporte.
 */
export function pickCfsOffer(
  current: CfsAvailabilityUpsertData | undefined,
  candidate: CfsAvailabilityUpsertData
): CfsAvailabilityUpsertData {
  if (!current) return candidate;
  if (current.isReference !== candidate.isReference) return current.isReference ? current : candidate;
  return conditionRank(current.condition) > conditionRank(candidate.condition) ? current : candidate;
}

function buildAffiliateUrl(productUrl: string): string {
  const sep = productUrl.includes("?") ? "&" : "?";
  return `${productUrl}${sep}${AFFILIATE_PARAMS}`;
}

function toOffer(item: CfsItem): CfsAvailabilityUpsertData | null {
  if (!item.price || !item.imageUrl || !isAllowedCfsUrl(item.url)) return null;
  if (WOMEN_RE.test(item.name) || !item.sizes.some((s) => TARGET_SIZES.has(s))) return null;
  return {
    price: item.price,
    promoPrice: item.promoPrice,
    productUrl: item.url,
    affiliateUrl: buildAffiliateUrl(item.url),
    imageUrl: item.imageUrl,
    isReference: !item.longSleeve && isReferenceListing(listingTraits(item.name)),
    condition: item.condition,
  };
}

// Une requête pour tous les clubs aliasés ; variante la plus basse par
// (club, saison, type), comme l'ancien findFirst(orderBy: variant asc).
async function buildJerseyIndex(clubIds: string[]): Promise<Map<string, string>> {
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

/** Maillot du catalogue pour (club, saison, type), saison exacte d'abord puis repli (sélections rangées par année). */
export function findJerseyId(index: Map<string, string>, clubId: string, season: string, type: string): string | null {
  for (const candidate of seasonCandidates(season)) {
    const id = index.get(`${clubId}|${candidate}|${type}`);
    if (id) return id;
  }
  return null;
}

const sameOffer = (a: CfsAvailabilityUpsertData, b: CfsAvailabilityUpsertData) =>
  a.price === b.price &&
  a.promoPrice === b.promoPrice &&
  a.productUrl === b.productUrl &&
  a.imageUrl === b.imageUrl &&
  a.isReference === b.isReference &&
  a.condition === b.condition;

export async function scrapeCfsAvailability(options: { budgetMs?: number } = {}): Promise<ScrapeStats> {
  const deadline = Date.now() + (options.budgetMs ?? DEFAULT_BUDGET_MS);
  const stats: ScrapeStats = {
    teamsTotal: 0,
    teamsScanned: 0,
    teamsWithoutAlias: 0,
    teamsNotReached: [],
    productsSeen: 0,
    matched: 0,
    written: 0,
    purged: 0,
    changedJerseyIds: [],
  };

  const [teams, aliases, followed] = await Promise.all([
    fetchCfsTeams(),
    prisma.cfsClubAlias.findMany({ select: { cfsName: true, clubId: true } }),
    prisma.$queryRaw<{ clubId: string }[]>`
      SELECT DISTINCT j."clubId" FROM jerseys j
      WHERE EXISTS (SELECT 1 FROM user_jerseys u WHERE u."jerseyId" = j.id)
         OR EXISTS (SELECT 1 FROM wishlist w WHERE w."jerseyId" = j.id)
    `,
  ]);
  stats.teamsTotal = teams.length;

  const clubByTeam = new Map(aliases.map((a) => [normalizeClubName(a.cfsName), a.clubId]));
  const followedClubs = new Set(followed.map((f) => f.clubId));
  const queue = teams
    .map((t) => ({ ...t, clubId: clubByTeam.get(normalizeClubName(t.name)) }))
    .filter((t): t is typeof t & { clubId: string } => {
      if (!t.clubId) stats.teamsWithoutAlias++;
      return !!t.clubId;
    })
    // Clubs suivis d'abord : un manque de temps ne touche pas les fiches regardées.
    .sort((a, b) => Number(followedClubs.has(b.clubId)) - Number(followedClubs.has(a.clubId)) || b.count - a.count);

  const jerseyIndex = await buildJerseyIndex([...new Set(queue.map((t) => t.clubId))]);

  const matches = new Map<string, CfsAvailabilityUpsertData>();
  const limit = pLimit(TEAM_FETCH_CONCURRENCY);
  await Promise.all(
    queue.map((team) =>
      limit(async () => {
        if (Date.now() > deadline) {
          stats.teamsNotReached.push(team.name);
          return;
        }
        let products: CfsItem[];
        try {
          products = await fetchTeamProducts(team.name);
        } catch (err) {
          console.error(`[cfs-availability] ${team.name} :`, err);
          stats.teamsNotReached.push(team.name);
          return;
        }
        stats.teamsScanned++;
        stats.productsSeen += products.length;

        for (const item of products) {
          const offer = toOffer(item);
          const season = parseCfsSeason(item.name);
          const type = parseCfsType(item.name);
          if (!offer || !season || !type) continue;
          const jerseyId = findJerseyId(jerseyIndex, team.clubId, season, type);
          if (!jerseyId) continue;
          stats.matched++;
          matches.set(jerseyId, pickCfsOffer(matches.get(jerseyId), offer));
        }
      })
    )
  );

  const existing = await prisma.cfsAvailability.findMany({
    select: {
      jerseyId: true,
      price: true,
      promoPrice: true,
      productUrl: true,
      affiliateUrl: true,
      imageUrl: true,
      isReference: true,
      condition: true,
    },
  });
  const before = new Map<string, CfsAvailabilityUpsertData>(
    existing.map((e) => [
      e.jerseyId,
      {
        price: Number(e.price),
        promoPrice: e.promoPrice === null ? null : Number(e.promoPrice),
        productUrl: e.productUrl,
        affiliateUrl: e.affiliateUrl,
        imageUrl: e.imageUrl,
        isReference: e.isReference,
        condition: e.condition,
      },
    ])
  );

  // Seules les dispos nouvelles ou modifiées sont réécrites ; les autres ne
  // reçoivent que leur date de passage, en une requête.
  const now = new Date();
  const toWrite = [...matches].filter(([jerseyId, offer]) => {
    const old = before.get(jerseyId);
    return !old || !sameOffer(old, offer);
  });
  const written = new Set(toWrite.map(([jerseyId]) => jerseyId));
  const unchangedIds = [...matches.keys()].filter((id) => !written.has(id));
  const upsertLimit = pLimit(UPSERT_CONCURRENCY);
  await Promise.all(
    toWrite.map(([jerseyId, data]) =>
      upsertLimit(() =>
        prisma.cfsAvailability.upsert({
          where: { jerseyId },
          create: { jerseyId, ...data },
          update: { ...data, lastSeenAt: now },
        })
      )
    )
  );
  if (unchangedIds.length > 0) {
    await prisma.cfsAvailability.updateMany({ where: { jerseyId: { in: unchangedIds } }, data: { lastSeenAt: now } });
  }
  stats.written = toWrite.length;

  const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_HOURS * 60 * 60 * 1000);
  const stale = await prisma.cfsAvailability.findMany({
    where: { lastSeenAt: { lt: staleThreshold } },
    select: { jerseyId: true },
  });
  const purged = await prisma.cfsAvailability.deleteMany({
    where: { jerseyId: { in: stale.map((r) => r.jerseyId) } },
  });
  stats.purged = purged.count;
  stats.changedJerseyIds = cfsChangedJerseyIds(
    before,
    matches,
    stale.map((r) => r.jerseyId)
  );

  return stats;
}
