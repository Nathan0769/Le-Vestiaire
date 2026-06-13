import { NextResponse } from "next/server";
import { requireRole } from "@/lib/check-permission";
import {
  strictRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { scrapeCfsPromos } from "@/lib/cfs-scraper";
import prisma from "@/lib/prisma";

export const maxDuration = 300;

export async function POST() {
  const { error, session } = await requireRole(["superadmin"]);
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(strictRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const promos = await scrapeCfsPromos({ maxResults: 20 });

    await prisma.$transaction(async (tx) => {
      await tx.cfsPromo.deleteMany();
      await tx.cfsPromo.createMany({
        data: promos.map((p, i) => ({
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
        })),
      });
    });

    return NextResponse.json({ count: promos.length });
  } catch (err) {
    console.error("POST /api/admin/cfs-promos/scrape error:", err);
    return NextResponse.json({ error: "Erreur lors du scraping" }, { status: 500 });
  }
}
