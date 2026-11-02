import type { PartnerMatchStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { normalizeClubName } from "./club-name";
import { seasonCandidates } from "./season-candidates";
import { parsePartnerTitle, type ParsedPartnerTitle } from "./title-parser";

export interface PartnerMatchResult {
  jerseyId: string | null;
  matchStatus: PartnerMatchStatus;
}

/**
 * Index nom normalisé -> clubId pour une boutique : ses alias d'abord, puis le
 * nom et le nom court de chaque club (les boutiques FR nomment les clubs comme
 * le catalogue). Un nom porté par deux clubs n'est pas indexé : il passera par un alias.
 */
export async function loadClubIndex(shop: string): Promise<Map<string, string>> {
  const [aliases, clubs] = await Promise.all([
    prisma.partnerClubAlias.findMany({ where: { shop }, select: { externalName: true, clubId: true } }),
    prisma.club.findMany({ select: { id: true, name: true, shortName: true } }),
  ]);

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
  for (const alias of aliases) index.set(normalizeClubName(alias.externalName), alias.clubId);
  return index;
}

export async function resolvePartnerMatch(
  parsed: ParsedPartnerTitle,
  clubIndex: Map<string, string>
): Promise<PartnerMatchResult> {
  if (!parsed.isJersey) return { jerseyId: null, matchStatus: "IGNORED" };
  if (!parsed.season || !parsed.type || !parsed.club) {
    return { jerseyId: null, matchStatus: "PARSE_FAILED" };
  }

  const clubId = clubIndex.get(normalizeClubName(parsed.club));
  if (!clubId) return { jerseyId: null, matchStatus: "NEEDS_ALIAS" };

  const seasons = seasonCandidates(parsed.season);
  const jerseys = await prisma.jersey.findMany({
    where: { clubId, season: { in: seasons }, type: parsed.type },
    orderBy: { variant: "asc" },
    select: { id: true, season: true },
  });
  const jersey = seasons.map((s) => jerseys.find((j) => j.season === s)).find(Boolean);
  if (!jersey) return { jerseyId: null, matchStatus: "NO_JERSEY" };

  return { jerseyId: jersey.id, matchStatus: "MATCHED" };
}

/**
 * Recalcule le matching de produits précis (après création d'un alias ou une
 * réinitialisation admin). Écrase MANUAL et IGNORED : à n'appeler que sur demande.
 */
export async function rematchPartnerProducts(shop: string, productIds: string[]): Promise<number> {
  if (productIds.length === 0) return 0;
  const [products, index] = await Promise.all([
    prisma.partnerProduct.findMany({
      where: { shop, id: { in: productIds } },
      select: { id: true, title: true },
    }),
    loadClubIndex(shop),
  ]);

  let matched = 0;
  for (const product of products) {
    // Le type produit Shopify n'est pas stocké : un produit en base a déjà passé le filtre des maillots.
    const match = await resolvePartnerMatch(parsePartnerTitle(product.title, "Maillot"), index);
    await prisma.partnerProduct.update({ where: { id: product.id }, data: match });
    if (match.matchStatus === "MATCHED") matched++;
  }
  return matched;
}
