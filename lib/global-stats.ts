import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { toCollectionPieces, type CollectionPiecesRow } from "@/lib/collection-pieces";
import type {
  CollectionPieces,
  GlobalStats,
  TopClubEntry,
  TopLeagueEntry,
  TopBrandEntry,
  MostOwnedJersey,
  TopRatedJersey,
  TopSeason,
} from "@/types/community-stats";

async function getTopClubs(): Promise<TopClubEntry[]> {
  const rows = await prisma.$queryRaw<
    { id: string; name: string; logoUrl: string; count: bigint }[]
  >`
    SELECT c.id, c.name, c."logoUrl", COUNT(*)::bigint as count
    FROM user_jerseys uj
    JOIN jerseys j ON j.id = uj."jerseyId"
    JOIN clubs c ON c.id = j."clubId"
    GROUP BY c.id, c.name, c."logoUrl"
    ORDER BY count DESC
    LIMIT 15
  `;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    logoUrl: r.logoUrl,
    count: Number(r.count),
  }));
}

async function getTopLeagues(): Promise<TopLeagueEntry[]> {
  const rows = await prisma.$queryRaw<
    {
      id: string;
      name: string;
      logoUrl: string;
      logoDarkUrl: string | null;
      count: bigint;
    }[]
  >`
    SELECT l.id, l.name, l."logoUrl", l."logoDarkUrl", COUNT(*)::bigint as count
    FROM user_jerseys uj
    JOIN jerseys j ON j.id = uj."jerseyId"
    JOIN clubs c ON c.id = j."clubId"
    JOIN leagues l ON l.id = c."leagueId"
    GROUP BY l.id, l.name, l."logoUrl", l."logoDarkUrl"
    ORDER BY count DESC
    LIMIT 15
  `;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    logoUrl: r.logoUrl,
    logoDarkUrl: r.logoDarkUrl,
    count: Number(r.count),
  }));
}

async function getTopBrands(): Promise<TopBrandEntry[]> {
  const rows = await prisma.$queryRaw<{ brand: string; count: bigint }[]>`
    SELECT INITCAP(LOWER(j.brand)) as brand, COUNT(*)::bigint as count
    FROM user_jerseys uj
    JOIN jerseys j ON j.id = uj."jerseyId"
    GROUP BY INITCAP(LOWER(j.brand))
    ORDER BY count DESC
    LIMIT 15
  `;
  return rows.map((r) => ({ name: r.brand, count: Number(r.count) }));
}

async function getMostOwnedJersey(): Promise<MostOwnedJersey | null> {
  const rows = await prisma.$queryRaw<
    {
      id: string;
      name: string;
      imageUrl: string;
      clubId: string;
      clubName: string;
      leagueId: string;
      count: bigint;
    }[]
  >`
    SELECT j.id, j.name, j."imageUrl", c.id as "clubId", c.name as "clubName", c."leagueId" as "leagueId", COUNT(*)::bigint as count
    FROM user_jerseys uj
    JOIN jerseys j ON j.id = uj."jerseyId"
    JOIN clubs c ON c.id = j."clubId"
    GROUP BY j.id, j.name, j."imageUrl", c.id, c.name, c."leagueId"
    ORDER BY count DESC
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    clubId: r.clubId,
    clubName: r.clubName,
    leagueId: r.leagueId,
    imageUrl: r.imageUrl,
    ownersCount: Number(r.count),
  };
}

async function getTopRatedJersey(): Promise<TopRatedJersey | null> {
  const rows = await prisma.$queryRaw<
    {
      id: string;
      name: string;
      imageUrl: string;
      clubId: string;
      clubName: string;
      leagueId: string;
      averageRating: number;
      votesCount: bigint;
    }[]
  >`
    SELECT j.id, j.name, j."imageUrl", c.id as "clubId", c.name as "clubName", c."leagueId" as "leagueId",
      AVG(r.rating)::float as "averageRating",
      COUNT(*)::bigint as "votesCount"
    FROM ratings r
    JOIN jerseys j ON j.id = r."jerseyId"
    JOIN clubs c ON c.id = j."clubId"
    GROUP BY j.id, j.name, j."imageUrl", c.id, c.name, c."leagueId"
    HAVING COUNT(*) >= 5
    ORDER BY "averageRating" DESC, "votesCount" DESC
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    clubId: r.clubId,
    clubName: r.clubName,
    leagueId: r.leagueId,
    imageUrl: r.imageUrl,
    averageRating: Math.round(r.averageRating * 100) / 100,
    votesCount: Number(r.votesCount),
  };
}

async function getTopSeasons(): Promise<TopSeason[]> {
  const rows = await prisma.$queryRaw<{ season: string; count: bigint }[]>`
    SELECT j.season, COUNT(*)::bigint as count
    FROM user_jerseys uj
    JOIN jerseys j ON j.id = uj."jerseyId"
    GROUP BY j.season
    ORDER BY count DESC
    LIMIT 5
  `;
  return rows.map((r) => ({ season: r.season, count: Number(r.count) }));
}

async function getAcquisitionsThisMonth(): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return prisma.userJersey.count({
    where: { createdAt: { gte: startOfMonth } },
  });
}

async function getCatalogCoverage(): Promise<number> {
  const [totalJerseys, ownedJerseyIds] = await Promise.all([
    prisma.jersey.count(),
    prisma.userJersey.findMany({
      select: { jerseyId: true },
      distinct: ["jerseyId"],
    }),
  ]);
  if (totalJerseys === 0) return 0;
  return Math.round((ownedJerseyIds.length / totalJerseys) * 10000) / 100;
}

async function getTotalCollectedJerseys(): Promise<number> {
  return prisma.userJersey.count();
}

/** Nombre de collectionneurs = tous les utilisateurs inscrits sur Le Vestiaire. */
async function getTotalCollectors(): Promise<number> {
  return prisma.user.count();
}

async function getAverageRating(): Promise<number | null> {
  const result = await prisma.rating.aggregate({
    _avg: { rating: true },
  });
  if (result._avg.rating === null) return null;
  return Math.round(Number(result._avg.rating) * 100) / 100;
}

async function getCollectionPieces(): Promise<CollectionPieces> {
  const rows = await prisma.$queryRaw<CollectionPiecesRow[]>`
    SELECT
      COUNT(*) FILTER (WHERE "isSigned")::bigint as "signed",
      COUNT(*) FILTER (WHERE version = 'MATCH_WORN')::bigint as "matchWorn",
      COUNT(*) FILTER (WHERE version = 'PLAYER_ISSUE')::bigint as "playerIssue",
      COUNT(*) FILTER (WHERE "hasAuthCertificate")::bigint as "withCertificate",
      COUNT(DISTINCT "userId") FILTER (
        WHERE "isSigned"
          OR version IN ('MATCH_WORN', 'PLAYER_ISSUE')
          OR "hasAuthCertificate"
      )::bigint as "collectorsWithPiece"
    FROM user_jerseys
  `;
  return toCollectionPieces(rows[0]);
}

async function getGlobalStats(): Promise<GlobalStats> {
  const [
    topClubs,
    topLeagues,
    topBrands,
    mostOwnedJersey,
    topRatedJersey,
    topSeasons,
    acquisitionsThisMonth,
    catalogCoverage,
    totalCollectedJerseys,
    totalCollectors,
    averageRating,
    collectionPieces,
  ] = await Promise.all([
    getTopClubs(),
    getTopLeagues(),
    getTopBrands(),
    getMostOwnedJersey(),
    getTopRatedJersey(),
    getTopSeasons(),
    getAcquisitionsThisMonth(),
    getCatalogCoverage(),
    getTotalCollectedJerseys(),
    getTotalCollectors(),
    getAverageRating(),
    getCollectionPieces(),
  ]);

  return {
    topClubs,
    topLeagues,
    topBrands,
    mostOwnedJersey,
    topRatedJersey,
    topSeason: topSeasons[0] ?? null,
    topSeasons,
    acquisitionsThisMonth,
    catalogCoverage,
    totalCollectedJerseys,
    totalCollectors,
    averageRating,
    collectionPieces,
  };
}

export const getGlobalStatsCached = unstable_cache(
  getGlobalStats,
  ["global-stats-v10"],
  { revalidate: 21600, tags: ["global-stats"] }
);
