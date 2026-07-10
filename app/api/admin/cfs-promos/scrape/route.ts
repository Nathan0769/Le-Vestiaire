import { NextResponse } from "next/server";
import { requireRole } from "@/lib/check-permission";
import { scrapeCfsPromos } from "@/lib/cfs-scraper";
import { resolveCfsMatch, loadCfsAliasMap } from "@/lib/cfs-matcher";
import prisma from "@/lib/prisma";

export const maxDuration = 300;

export async function POST() {
  const { error } = await requireRole(["superadmin"]);
  if (error) return error;

  try {
    const promos = await scrapeCfsPromos({ maxResults: 20 });

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

    return NextResponse.json({ count: promos.length, stats });
  } catch (err) {
    console.error("POST /api/admin/cfs-promos/scrape error:", err);
    return NextResponse.json({ error: "Erreur lors du scraping" }, { status: 500 });
  }
}
