import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import type {
  GlobalStats,
  UserComparison,
  TopClubEntry,
  TopLeagueEntry,
  TopBrandEntry,
  MostOwnedJersey,
  TopRatedJersey,
  TopSeason,
  RareJersey,
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
    LIMIT 5
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
    LIMIT 5
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
    LIMIT 5
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
    SELECT j.id, j.name, j."imageUrl", c.id as "clubId", c.name as "clubName", c."leagueId" as "leagueId", COUNT(DISTINCT uj."userId")::bigint as count
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

async function getTopSeason(): Promise<TopSeason | null> {
  const rows = await prisma.$queryRaw<{ season: string; count: bigint }[]>`
    SELECT j.season, COUNT(*)::bigint as count
    FROM user_jerseys uj
    JOIN jerseys j ON j.id = uj."jerseyId"
    GROUP BY j.season
    ORDER BY count DESC
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return { season: rows[0].season, count: Number(rows[0].count) };
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

async function getAverageRating(): Promise<number | null> {
  const result = await prisma.rating.aggregate({
    _avg: { rating: true },
  });
  if (result._avg.rating === null) return null;
  return Math.round(Number(result._avg.rating) * 100) / 100;
}

async function getGlobalStats(): Promise<GlobalStats> {
  const [
    topClubs,
    topLeagues,
    topBrands,
    mostOwnedJersey,
    topRatedJersey,
    topSeason,
    acquisitionsThisMonth,
    catalogCoverage,
    totalCollectedJerseys,
    averageRating,
  ] = await Promise.all([
    getTopClubs(),
    getTopLeagues(),
    getTopBrands(),
    getMostOwnedJersey(),
    getTopRatedJersey(),
    getTopSeason(),
    getAcquisitionsThisMonth(),
    getCatalogCoverage(),
    getTotalCollectedJerseys(),
    getAverageRating(),
  ]);

  return {
    topClubs,
    topLeagues,
    topBrands,
    mostOwnedJersey,
    topRatedJersey,
    topSeason,
    acquisitionsThisMonth,
    catalogCoverage,
    totalCollectedJerseys,
    averageRating,
  };
}

export const getGlobalStatsCached = unstable_cache(
  getGlobalStats,
  ["global-stats-v4"],
  { revalidate: 21600, tags: ["global-stats"] }
);

async function getUserComparison(userId: string): Promise<UserComparison> {
  const [user, personalJerseyIds] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        favoriteClub: {
          select: { id: true, name: true, logoUrl: true, leagueId: true },
        },
      },
    }),
    prisma.userJersey.findMany({
      where: { userId },
      select: { jerseyId: true },
      distinct: ["jerseyId"],
    }),
  ]);

  let favoriteClubCoverage: UserComparison["favoriteClubCoverage"] = null;

  if (user?.favoriteClub) {
    const club = user.favoriteClub;
    const [totalCount, ownedDistinct] = await Promise.all([
      prisma.jersey.count({ where: { clubId: club.id } }),
      prisma.userJersey.findMany({
        where: { userId, jersey: { clubId: club.id } },
        select: { jerseyId: true },
        distinct: ["jerseyId"],
      }),
    ]);
    favoriteClubCoverage = {
      clubId: club.id,
      clubName: club.name,
      clubLogoUrl: club.logoUrl,
      leagueId: club.leagueId,
      ownedCount: ownedDistinct.length,
      totalCount,
      percentage:
        totalCount > 0
          ? Math.round((ownedDistinct.length / totalCount) * 10000) / 100
          : 0,
    };
  }

  let rarestJerseys: RareJersey[] = [];

  if (personalJerseyIds.length > 0) {
    const rows = await prisma.$queryRaw<
      {
        id: string;
        name: string;
        imageUrl: string;
        clubId: string;
        clubName: string;
        leagueId: string;
        ownersCount: bigint;
      }[]
    >`
      WITH owner_counts AS (
        SELECT "jerseyId", COUNT(DISTINCT "userId")::bigint as count
        FROM user_jerseys
        GROUP BY "jerseyId"
      )
      SELECT j.id, j.name, j."imageUrl", c.id as "clubId", c.name as "clubName", c."leagueId" as "leagueId",
        oc.count as "ownersCount"
      FROM (
        SELECT DISTINCT "jerseyId"
        FROM user_jerseys
        WHERE "userId" = ${userId}
      ) uuj
      JOIN jerseys j ON j.id = uuj."jerseyId"
      JOIN clubs c ON c.id = j."clubId"
      JOIN owner_counts oc ON oc."jerseyId" = uuj."jerseyId"
      ORDER BY oc.count ASC, j.id ASC
      LIMIT 3
    `;
    rarestJerseys = rows.map((r) => ({
      id: r.id,
      name: r.name,
      clubId: r.clubId,
      clubName: r.clubName,
      leagueId: r.leagueId,
      imageUrl: r.imageUrl,
      ownersCount: Number(r.ownersCount),
    }));
  }

  return {
    favoriteClubCoverage,
    rarestJerseys,
  };
}

export async function getUserComparisonCached(
  userId: string
): Promise<UserComparison> {
  return unstable_cache(
    () => getUserComparison(userId),
    ["user-comparison-v2", userId],
    { revalidate: 1800, tags: [`user-comparison-${userId}`] }
  )();
}
