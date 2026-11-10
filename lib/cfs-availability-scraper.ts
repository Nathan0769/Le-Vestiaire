import pLimit from "p-limit";
import prisma from "@/lib/prisma";
import { parseCfsClub, parseCfsSeason, parseCfsType } from "@/lib/cfs-name-parser";
import { buildCfsAffiliateUrl } from "@/lib/cfs-affiliate";
import { cfsSitePrices } from "@/lib/cfs-price";
import { getRatesToEur } from "@/lib/fx";
import { fetchCfsTeams, fetchTeamProducts, isAllowedCfsUrl, type CfsItem } from "@/lib/cfs-constructor";
import { isReferenceListing, listingTraits } from "@/lib/market-value/listing-traits";
import {
  cfsUpdatePriority,
  nextCfsProductState,
  pickDisplayedOffer,
  type CfsProductState,
  type SeenCfsProduct,
} from "@/lib/cfs-products";
import { bulkUpdateCfsProducts } from "@/lib/cfs-products-bulk";
import { normalizeClubName } from "@/lib/partner-shops/club-name";
import { seasonCandidates, spanSeasons } from "@/lib/partner-shops/season-candidates";
import type { Condition } from "@/lib/market-value/types";

/**
 * Produits CFS de toutes les équipes reliées à un club du catalogue (CfsClubAlias)
 * et des groupes de clubs : une ligne CfsProduct par (produit, maillot), ruptures
 * comprises, puis CfsAvailability = le produit en stock le moins cher du maillot.
 * Specs : docs/specs/2026-11-02-cfs-catalogue-complet.md,
 * docs/specs/2026-11-03-cfs-produits-stock.md.
 */

// Le réseau est le goulot ; les écritures partagent le pool Prisma.
const TEAM_FETCH_CONCURRENCY = 6;
const UPSERT_CONCURRENCY = 8;
const CREATE_BATCH = 1_000;
const CREATE_CONCURRENCY = 4;
const DELETE_BATCH = 5_000;
/**
 * Temps laissé à la lecture de CFS (~90 s mesurées le 2026-11-10) : le reste des
 * 300 s du cron va aux écritures. Avant, 240 s ne laissaient presque rien.
 */
const DEFAULT_BUDGET_MS = 150_000;
/**
 * Lignes modifiées écrites par passage. Mesuré en prod le 2026-11-10 : 30 000
 * lignes ~150 s, passage normal ~500 lignes et 135 s au total (lecture CFS ~105 s).
 * Au-delà, les simples changements de prix attendent la nuit suivante : le cron finit toujours.
 */
const MAX_UPDATES_PER_RUN = 10_000;
// Au moins une taille de XS à XXL : une pièce en 3XL ou 4XL seulement n'intéresse presque personne.
const TARGET_SIZES = new Set(["XS", "S", "M", "L", "XL", "XXL"]);
// Coupe femme : pas un maillot du catalogue (le filtre de l'API ne la distingue pas).
const WOMEN_RE = /\bwom[ae]n'?s?\b/i;

interface ScrapeStats {
  teamsTotal: number;
  teamsScanned: number;
  /** Équipes CFS sans alias vers un club du catalogue (hors groupes). */
  teamsWithoutAlias: number;
  /** Équipes aliasées non parcourues faute de temps. */
  teamsNotReached: string[];
  productsSeen: number;
  matched: number;
  /** Lignes CfsProduct vues : créées, modifiées, en stock. */
  products: number;
  productsCreated: number;
  productsUpdated: number;
  productsInStock: number;
  /** Passages en rupture (ventes déduites) et retours sous 48 h. */
  sales: number;
  cancelledSales: number;
  /** Lignes modifiées reportées au passage suivant (plafond par passage). */
  productsDeferred: number;
  /** Lignes CfsProduct absentes du passage (équipe lue), supprimées. */
  purged: number;
  /** Offres affichées (CfsAvailability) écrites, et retirées faute de produit en stock. */
  written: number;
  removed: number;
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

/** Produit CFS gardé (en stock ou non), ou null s'il ne correspond à aucun maillot du catalogue. */
export function toProduct(item: CfsItem): SeenCfsProduct | null {
  if (!item.price || !item.imageUrl || !isAllowedCfsUrl(item.url)) return null;
  if (WOMEN_RE.test(item.name) || !item.sizes.some((s) => TARGET_SIZES.has(s))) return null;
  return {
    name: item.name,
    price: item.price,
    promoPrice: item.promoPrice,
    inStock: item.inStockSizes.some((s) => TARGET_SIZES.has(s)),
    isReference: !item.longSleeve && isReferenceListing(listingTraits(item.name)),
    condition: item.condition,
    productUrl: item.url,
    imageUrl: item.imageUrl,
  };
}

const toDisplayed = (p: SeenCfsProduct): CfsAvailabilityUpsertData => ({
  price: p.price,
  promoPrice: p.promoPrice,
  productUrl: p.productUrl,
  affiliateUrl: buildCfsAffiliateUrl(p.productUrl),
  imageUrl: p.imageUrl,
  isReference: p.isReference,
  condition: p.condition,
});

const STORED_READ_BATCH = 20_000;

/**
 * Produits déjà en base, sans les textes (nom, liens) : lus d'un bloc, les
 * ~200 000 lignes complètes prennent 1,7 Go et font tomber la fonction Vercel
 * (incident du 2026-11-04). Lecture par paquets, nombres en float8.
 */
async function loadStoredProducts() {
  type Row = {
    id: string;
    cfsId: string;
    jerseyId: string;
    price: number;
    promoPrice: number | null;
    inStock: boolean;
    isReference: boolean;
    condition: Condition | null;
    soldAt: Date | null;
    soldPrice: number | null;
    lastSeenAt: Date;
  };
  const stored = new Map<
    string,
    { id: string; jerseyId: string; lastSeenAt: Date; state: Omit<CfsProductState, "name" | "productUrl" | "imageUrl"> }
  >();
  let cursor = "";
  for (;;) {
    const rows = await prisma.$queryRaw<Row[]>`
      SELECT id, "cfsId", "jerseyId", price::float8 AS price, "promoPrice"::float8 AS "promoPrice",
             "inStock", "isReference", condition::text AS condition, "soldAt",
             "soldPrice"::float8 AS "soldPrice", "lastSeenAt"
      FROM cfs_products WHERE id > ${cursor} ORDER BY id LIMIT ${STORED_READ_BATCH}`;
    for (const r of rows) {
      stored.set(`${r.cfsId}|${r.jerseyId}`, {
        id: r.id,
        jerseyId: r.jerseyId,
        lastSeenAt: r.lastSeenAt,
        state: {
          price: r.price,
          promoPrice: r.promoPrice,
          inStock: r.inStock,
          isReference: r.isReference,
          condition: r.condition,
          soldAt: r.soldAt,
          soldPrice: r.soldPrice,
        },
      });
    }
    if (rows.length < STORED_READ_BATCH) return stored;
    cursor = rows[rows.length - 1].id;
  }
}

const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

/**
 * Groupe CFS qui rassemble plusieurs clubs ("Swiss Teams", "Other Italian
 * Clubs", "Other") : pas d'alias possible, le club se lit dans chaque produit.
 */
export function isGroupedCfsTeam(name: string): boolean {
  return /^Other$/.test(name) || /^Other\b.*\b(?:Clubs|Teams)$/.test(name) || /\bTeams$/.test(name);
}

// Noms courts qu'un groupe CFS emploie pour un autre club que celui du catalogue
// (la sélection d'Andorre, Bohemian FC de Dublin, Racing Club d'Avellaneda).
// Relevés au premier passage sur les groupes, le 2026-11-03.
const AMBIGUOUS_GROUPED_NAMES = new Set(["andorra", "bohemians", "racing", "liverpool"]);

/** Club du catalogue d'un produit : celui de l'alias, sinon le club lu dans le nom (groupe). */
export function clubIdForItem(
  team: { name: string; clubId?: string },
  productName: string,
  clubIndex: Map<string, string>
): string | undefined {
  if (team.clubId) return team.clubId;
  const club = parseCfsClub(productName);
  const key = club ? normalizeClubName(club) : "";
  return key && !AMBIGUOUS_GROUPED_NAMES.has(key) ? clubIndex.get(key) : undefined;
}

/**
 * Nom normalisé -> clubId : alias CFS, puis nom et nom court des clubs. Un nom
 * porté par deux clubs n'est pas indexé (comme loadClubIndex des boutiques).
 */
async function buildClubNameIndex(aliases: { cfsName: string; clubId: string }[]): Promise<Map<string, string>> {
  const clubs = await prisma.club.findMany({ select: { id: true, name: true, shortName: true } });
  const byName = new Map<string, string | null>();
  for (const club of clubs) {
    for (const key of new Set([normalizeClubName(club.name), normalizeClubName(club.shortName)])) {
      if (!key) continue;
      const existing = byName.get(key);
      byName.set(key, existing === undefined || existing === club.id ? club.id : null);
    }
  }
  const index = new Map<string, string>();
  for (const [key, clubId] of byName) if (clubId) index.set(key, clubId);
  for (const alias of aliases) index.set(normalizeClubName(alias.cfsName), alias.clubId);
  return index;
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

/** Type de base d'une version spéciale ("'CL Winners' Home Shirt" -> HOME), lu dans le nom. */
export function baseJerseyType(name: string): "HOME" | "AWAY" | "THIRD" | null {
  if (/\bHome\b/i.test(name)) return "HOME";
  if (/\bAway\b/i.test(name)) return "AWAY";
  if (/\bThird\b/i.test(name)) return "THIRD";
  return null;
}

/**
 * Fiches du catalogue pour un produit CFS : saison exacte d'abord ; un maillot
 * porté plusieurs saisons ("2008-10") est relié à chaque saison couverte ;
 * sinon repli (sélections rangées par année). Types essayés dans l'ordre
 * (type lu, puis type de base d'une version spéciale absente du catalogue).
 */
export function findJerseyIds(
  index: Map<string, string>,
  clubId: string,
  season: string,
  types: string[]
): string[] {
  const lookup = (s: string, type: string) => index.get(`${clubId}|${s}|${type}`);
  for (const type of [...new Set(types)]) {
    const exact = lookup(season, type);
    if (exact) return [exact];
    const spanned = spanSeasons(season)
      .map((s) => lookup(s, type))
      .filter((id): id is string => !!id);
    if (spanned.length > 0) return spanned;
    for (const candidate of seasonCandidates(season)) {
      const id = lookup(candidate, type);
      if (id) return [id];
    }
  }
  return [];
}

export const sameCfsOffer = (a: CfsAvailabilityUpsertData, b: CfsAvailabilityUpsertData) =>
  a.price === b.price &&
  a.promoPrice === b.promoPrice &&
  a.productUrl === b.productUrl &&
  a.affiliateUrl === b.affiliateUrl &&
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
    products: 0,
    productsCreated: 0,
    productsUpdated: 0,
    productsInStock: 0,
    sales: 0,
    cancelledSales: 0,
    productsDeferred: 0,
    purged: 0,
    written: 0,
    removed: 0,
    changedJerseyIds: [],
  };

  const [teams, aliases, followed, rates] = await Promise.all([
    fetchCfsTeams(),
    prisma.cfsClubAlias.findMany({ select: { cfsName: true, clubId: true } }),
    prisma.$queryRaw<{ clubId: string }[]>`
      SELECT DISTINCT j."clubId" FROM jerseys j
      WHERE EXISTS (SELECT 1 FROM user_jerseys u WHERE u."jerseyId" = j.id)
         OR EXISTS (SELECT 1 FROM wishlist w WHERE w."jerseyId" = j.id)
    `,
    getRatesToEur(),
  ]);
  stats.teamsTotal = teams.length;

  const clubByTeam = new Map(aliases.map((a) => [normalizeClubName(a.cfsName), a.clubId]));
  const followedClubs = new Set(followed.map((f) => f.clubId));
  const queue = teams
    .map((t) => ({ ...t, clubId: clubByTeam.get(normalizeClubName(t.name)) }))
    .filter((t) => {
      if (t.clubId || isGroupedCfsTeam(t.name)) return true;
      stats.teamsWithoutAlias++;
      return false;
    })
    // Clubs suivis d'abord, groupes ensuite : un manque de temps ne touche pas les fiches regardées.
    .sort(
      (a, b) =>
        Number(!!b.clubId && followedClubs.has(b.clubId)) - Number(!!a.clubId && followedClubs.has(a.clubId)) ||
        b.count - a.count
    );

  const clubIndex = await buildClubNameIndex(aliases);
  const jerseyIndex = await buildJerseyIndex([...new Set(clubIndex.values())]);
  const clubOfJersey = new Map([...jerseyIndex].map(([key, jerseyId]) => [jerseyId, key.split("|")[0]]));
  const unreached: { name: string; clubId?: string }[] = [];

  // Clé `${cfsId}|${jerseyId}` : un produit vu dans son équipe et dans un groupe ne compte qu'une fois.
  // sitePrices : prix affiché par le site, pour l'offre de la fiche ; `product.price`
  // (euros de l'API) reste la base de la cote, calibrée dessus.
  const seen = new Map<
    string,
    { cfsId: string; jerseyId: string; product: SeenCfsProduct; sitePrices: { price: number; promoPrice: number | null } }
  >();
  const limit = pLimit(TEAM_FETCH_CONCURRENCY);
  await Promise.all(
    queue.map((team) =>
      limit(async () => {
        if (Date.now() > deadline) {
          unreached.push(team);
          stats.teamsNotReached.push(team.name);
          return;
        }
        let products: CfsItem[];
        try {
          products = await fetchTeamProducts(team.name);
        } catch (err) {
          console.error(`[cfs-availability] ${team.name} :`, err);
          unreached.push(team);
          stats.teamsNotReached.push(team.name);
          return;
        }
        stats.teamsScanned++;
        stats.productsSeen += products.length;

        for (const item of products) {
          const product = toProduct(item);
          const season = parseCfsSeason(item.name);
          const type = parseCfsType(item.name);
          if (!product || !season || !type) continue;
          const clubId = clubIdForItem(team, item.name, clubIndex);
          if (!clubId) continue;
          const base = baseJerseyType(item.name);
          const jerseyIds = findJerseyIds(jerseyIndex, clubId, season, base ? [type, base] : [type]);
          if (jerseyIds.length === 0) continue;
          stats.matched++;
          const sitePrices = cfsSitePrices({ ...product, priceGbp: item.priceGbp, promoPriceGbp: item.promoPriceGbp }, rates.GBP);
          for (const jerseyId of jerseyIds) {
            seen.set(`${item.cfsId}|${jerseyId}`, { cfsId: item.cfsId, jerseyId, product, sitePrices });
          }
        }
      })
    )
  );

  const now = new Date();
  // Un produit absent n'a vraiment quitté CFS que si son équipe a été lue. Équipe
  // non lue : ses clubs sont épargnés ; groupe non lu (clubs mêlés) : rien n'est retiré.
  const skippedClubs = new Set(unreached.flatMap((t) => (t.clubId ? [t.clubId] : [])));
  const canRemove = unreached.some((t) => !t.clubId)
    ? () => false
    : (jerseyId: string) => !skippedClubs.has(clubOfJersey.get(jerseyId) ?? "");

  // 1. Produits : création et mise à jour des seules lignes changées. Les lignes
  // inchangées ne sont plus réécrites (lastSeenAt = dernière écriture).
  const stored = await loadStoredProducts();

  const toCreate: (CfsProductState & { cfsId: string; jerseyId: string })[] = [];
  const toUpdate: { id: string; state: CfsProductState; priority: 0 | 1 }[] = [];
  // État courant de chaque produit encore valable, par maillot, pour l'offre affichée.
  const productsByJersey = new Map<string, CfsProductState[]>();
  const keep = (jerseyId: string, state: CfsProductState) => {
    const list = productsByJersey.get(jerseyId);
    if (list) list.push(state);
    else productsByJersey.set(jerseyId, [state]);
  };

  for (const [key, { cfsId, jerseyId, product, sitePrices }] of seen) {
    const old = stored.get(key);
    // Textes non relus (mémoire) : réputés inchangés, réécrits au prochain vrai changement.
    const oldState = old && {
      ...old.state,
      name: product.name,
      productUrl: product.productUrl,
      imageUrl: product.imageUrl,
    };
    const next = nextCfsProductState(oldState, product, now);
    if (next.sale) stats.sales++;
    if (next.cancelled) stats.cancelledSales++;
    if (!old) toCreate.push({ ...next.state, cfsId, jerseyId });
    else if (next.changed) toUpdate.push({ id: old.id, state: next.state, priority: cfsUpdatePriority(oldState!, next.state) });
    keep(jerseyId, { ...next.state, ...sitePrices });
  }
  const goneIds = [...stored]
    .filter(([key, old]) => !seen.has(key) && canRemove(old.jerseyId))
    .map(([, old]) => old.id);
  stored.clear();

  const createLimit = pLimit(CREATE_CONCURRENCY);
  await Promise.all(
    chunk(toCreate, CREATE_BATCH).map((batch) =>
      createLimit(() =>
        prisma.cfsProduct.createMany({
          data: batch.map((p) => ({ ...p, firstSeenAt: now, lastSeenAt: now })),
          skipDuplicates: true,
        })
      )
    )
  );
  toUpdate.sort((a, b) => a.priority - b.priority);
  await bulkUpdateCfsProducts(toUpdate.slice(0, MAX_UPDATES_PER_RUN), now);
  stats.productsDeferred = Math.max(0, toUpdate.length - MAX_UPDATES_PER_RUN);

  let purgedCount = 0;
  for (const ids of chunk(goneIds, DELETE_BATCH)) {
    purgedCount += (await prisma.cfsProduct.deleteMany({ where: { id: { in: ids } } })).count;
  }

  stats.products = seen.size;
  stats.productsCreated = toCreate.length;
  stats.productsUpdated = toUpdate.length;
  stats.productsInStock = [...seen.values()].filter((s) => s.product.inStock).length;
  stats.purged = purgedCount;

  // 2. Offre affichée : le produit en stock le moins cher de chaque maillot.
  const displayed = new Map<string, CfsAvailabilityUpsertData>();
  for (const [jerseyId, products] of productsByJersey) {
    const best = pickDisplayedOffer(products);
    if (best) displayed.set(jerseyId, toDisplayed(best));
  }

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

  const toWrite = [...displayed].filter(([jerseyId, offer]) => {
    const old = before.get(jerseyId);
    return !old || !sameCfsOffer(old, offer);
  });
  const upsertLimit = pLimit(UPSERT_CONCURRENCY);
  await Promise.all(
    toWrite.map(([jerseyId, data]) =>
      upsertLimit(() =>
        prisma.cfsAvailability.upsert({
          where: { jerseyId },
          create: { jerseyId, ...data, lastSeenAt: now },
          update: { ...data, lastSeenAt: now },
        })
      )
    )
  );
  // Plus aucun produit en stock : le lien disparaît de la fiche (équipe lue seulement).
  const removedIds = [...before.keys()].filter((id) => !displayed.has(id) && canRemove(id));
  for (const ids of chunk(removedIds, DELETE_BATCH)) {
    await prisma.cfsAvailability.deleteMany({ where: { jerseyId: { in: ids } } });
  }
  stats.written = toWrite.length;
  stats.removed = removedIds.length;
  stats.changedJerseyIds = cfsChangedJerseyIds(before, displayed, removedIds);

  return stats;
}
