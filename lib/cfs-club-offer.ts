import prisma from "@/lib/prisma";
import { cheapestCfsOffer, cheapestCfsOfferByClub, type CfsOffer } from "@/lib/where-to-buy";

/**
 * Maillot CFS le moins cher d'un club, proposé quand un maillot n'est en vente
 * nulle part (fiche maillot, page de partage d'une wishlist).
 */

const SELECT = { price: true, promoPrice: true, affiliateUrl: true } as const;

type Row = { price: { toString(): string }; promoPrice: { toString(): string } | null; affiliateUrl: string };

const toOffer = (o: Row): CfsOffer => ({
  price: Number(o.price),
  promoPrice: o.promoPrice == null ? null : Number(o.promoPrice),
  affiliateUrl: o.affiliateUrl,
});

/** Un club : deux lectures (promo, prix normal), Prisma ne trie pas sur COALESCE(promoPrice, price). */
export async function getCfsClubOffer(clubId: string): Promise<CfsOffer | null> {
  const [promo, regular] = await Promise.all([
    prisma.cfsAvailability.findFirst({
      where: { jersey: { clubId }, promoPrice: { not: null } },
      orderBy: { promoPrice: "asc" },
      select: SELECT,
    }),
    prisma.cfsAvailability.findFirst({ where: { jersey: { clubId } }, orderBy: { price: "asc" }, select: SELECT }),
  ]);
  return cheapestCfsOffer([promo && toOffer(promo), regular && toOffer(regular)]);
}

/**
 * Plusieurs clubs en une seule requête (page de partage : jusqu'à 20 maillots,
 * pas deux lectures par maillot). Clubs sans offre CFS absents de la Map.
 * `excludeJerseyIds` : maillots à ne pas proposer comme « autre maillot du club »
 * (une envie en vente chez CFS mais pas dans la taille voulue).
 */
export async function getCfsClubOffers(
  clubIds: string[],
  excludeJerseyIds: string[] = []
): Promise<Map<string, CfsOffer>> {
  const ids = [...new Set(clubIds)];
  if (ids.length === 0) return new Map();
  const rows = await prisma.cfsAvailability.findMany({
    where: {
      jersey: { clubId: { in: ids } },
      ...(excludeJerseyIds.length > 0 ? { jerseyId: { notIn: excludeJerseyIds } } : {}),
    },
    select: { ...SELECT, jersey: { select: { clubId: true } } },
  });
  return cheapestCfsOfferByClub(rows.map((r) => ({ ...toOffer(r), clubId: r.jersey.clubId })));
}
