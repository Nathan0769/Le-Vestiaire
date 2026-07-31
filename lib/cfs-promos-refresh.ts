import { scrapeCfsPromos } from "@/lib/cfs-scraper";
import { resolveCfsMatch, loadCfsAliasMap } from "@/lib/cfs-matcher";
import prisma from "@/lib/prisma";

export interface RefreshCfsPromosResult {
  count: number;
  stats: {
    total: number;
    matched: number;
    needsAlias: number;
    noJersey: number;
    parseFailed: number;
  };
}

/**
 * Scrape CFS promos, resolve each to a catalog jersey, and atomically replace the
 * cfs_promos table. Shared by the admin route (manual) and the cron route (12h).
 */
export async function refreshCfsPromos(
  maxResults = 20
): Promise<RefreshCfsPromosResult> {
  const promos = await scrapeCfsPromos({ maxResults });

  const aliasMap = await loadCfsAliasMap();
  const enriched = await Promise.all(
    promos.map(async (p) => {
      const match = await resolveCfsMatch({ name: p.name, club: p.club }, aliasMap);
      return { ...p, ...match };
    })
  );

  await prisma.$transaction(async (tx) => {
    await tx.cfsPromo.deleteMany();
    await tx.cfsPromo.createMany({
      data: enriched.map((p, i) => ({
        name: p.name,
        imageUrl: p.imageUrl,
        price: p.price,
        promoPrice: p.promoPrice,
        affiliateUrl: p.affiliateUrl,
        club: p.club,
        brand: p.brand,
        source: p.source,
        sizes: p.sizes,
        isActive: true,
        position: i,
        season: p.season,
        type: p.type,
        jerseyId: p.jerseyId,
        matchStatus: p.matchStatus,
      })),
    });
  });

  const stats = {
    total: enriched.length,
    matched: enriched.filter((p) => p.matchStatus === "MATCHED").length,
    needsAlias: enriched.filter((p) => p.matchStatus === "NEEDS_ALIAS").length,
    noJersey: enriched.filter((p) => p.matchStatus === "NO_JERSEY").length,
    parseFailed: enriched.filter((p) => p.matchStatus === "PARSE_FAILED").length,
  };

  return { count: promos.length, stats };
}
