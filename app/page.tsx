import { getCurrentUser } from "@/lib/get-current-user";
import { HeroSection } from "@/components/home/hero-section";
import { UserStatsSection } from "@/components/home/user-stats-section";
import { TopRatedSection } from "@/components/home/top-rated-section";
import { RecentSection } from "@/components/home/recent-section";
import prisma from "@/lib/prisma";
import type {
  TopRatedJersey,
  RecentJersey,
  UserHomeStats,
  TopRatedRow,
  RawResult,
} from "@/types/home";

export const revalidate = 3600;

async function getTopRatedJerseys(): Promise<TopRatedJersey[]> {
  console.time("⏱️ getTopRatedJerseys - Total");
  console.time("⏱️ getTopRatedJerseys - Query");

  const rows = await prisma.$queryRaw<TopRatedRow[]>`
WITH jersey_ratings AS (
  SELECT 
    "jerseyId",
    AVG(rating)::numeric(10,2) as average_rating,
    COUNT(id)::int as total_ratings
  FROM ratings 
  GROUP BY "jerseyId"
  HAVING COUNT(id) > 3 
),
top_rated_jerseys AS (
  SELECT 
    "jerseyId",
    average_rating,
    total_ratings
  FROM jersey_ratings
  ORDER BY average_rating DESC, total_ratings DESC
  LIMIT 20  
)
SELECT
  j.id,
  j.name,
  j."imageUrl",
  j.type,
  j.season,
  j.brand,
  c.id as club_id,
  c.name as club_name,
  c."shortName" as club_short_name,
  c."logoUrl" as club_logo_url,
  c."primaryColor" as club_primary_color,
  l.id as league_id,
  l.name as league_name,
  l.country as league_country,
  l."logoUrl" as league_logo_url,
  l.tier as league_tier,
  tr.average_rating,
  tr.total_ratings
FROM top_rated_jerseys tr
JOIN jerseys j ON tr."jerseyId" = j.id
JOIN clubs c ON j."clubId" = c.id
LEFT JOIN leagues l ON c."leagueId" = l.id
ORDER BY tr.average_rating DESC, tr.total_ratings DESC
LIMIT 6`;

  console.timeEnd("⏱️ getTopRatedJerseys - Query");
  console.log(`📊 getTopRatedJerseys - Résultats trouvés: ${rows.length}`);
  console.time("⏱️ getTopRatedJerseys - Mapping");

  const result = rows.map(
    (r): TopRatedJersey => ({
      id: r.id,
      name: r.name,
      imageUrl: r.imageUrl,
      type: r.type,
      season: r.season,
      brand: r.brand,
      club: {
        id: r.club_id,
        name: r.club_name,
        shortName: r.club_short_name,
        logoUrl: r.club_logo_url,
        primaryColor: r.club_primary_color,
        leagueId: r.league_id,
        league: {
          id: r.league_id,
          name: r.league_name,
          country: r.league_country,
          logoUrl: r.league_logo_url,
          tier: r.league_tier,
        },
      },
      averageRating: Number(r.average_rating),
      totalRatings: r.total_ratings,
    })
  );

  console.timeEnd("⏱️ getTopRatedJerseys - Mapping");
  console.timeEnd("⏱️ getTopRatedJerseys - Total");
  return result;
}

async function getRecentJerseys(): Promise<RecentJersey[]> {
  console.time("⚡ getRecentJerseys - Raw SQL");

  const jerseys = (await prisma.$queryRaw`
   WITH latest_jerseys AS (
  SELECT id, name, "imageUrl", type, season, brand, "createdAt", "clubId"
  FROM jerseys
  ORDER BY "createdAt" DESC
  LIMIT 6
)
SELECT 
    j.id, j.name, j."imageUrl", j.type, j.season, j.brand, j."createdAt",
    c.id AS club_id, c.name AS club_name,
    l.id AS league_id, l.name AS league_name
FROM latest_jerseys j
JOIN clubs c ON j."clubId" = c.id
JOIN leagues l ON c."leagueId" = l.id;

  `) as RawResult[];

  console.timeEnd("⚡ getRecentJerseys - Raw SQL");

  return jerseys.map(
    (j): RecentJersey => ({
      id: j.id,
      name: j.name,
      imageUrl: j.imageUrl,
      type: j.type,
      season: j.season,
      brand: j.brand,
      createdAt: j.createdAt.toISOString(),
      club: {
        id: j.club_id,
        name: j.club_name,
        league: {
          id: j.league_id,
          name: j.league_name || "N/A",
        },
      },
    })
  );
}

async function getUserStats(userId: string): Promise<UserHomeStats> {
  console.time("⏱️ getUserStats - Total");
  console.time("⏱️ getUserStats - First Promise.all");

  const [collectionStats, wishlistStats, recentCollectionItems] =
    await Promise.all([
      prisma.userJersey.aggregate({
        where: { userId },
        _count: { id: true },
        _sum: { purchasePrice: true },
      }),

      prisma.wishlist.aggregate({
        where: { userId },
        _count: { id: true },
      }),

      prisma.userJersey.findMany({
        where: { userId },
        select: {
          id: true,
          purchasePrice: true,
          createdAt: true,
          jersey: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              type: true,
              club: {
                select: {
                  id: true,
                  name: true,
                  shortName: true,
                  league: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);

  console.timeEnd("⏱️ getUserStats - First Promise.all");
  console.log(
    `📊 getUserStats - Collection: ${collectionStats._count.id} items, Wishlist: ${wishlistStats._count.id} items`
  );
  console.time("⏱️ getUserStats - Second Promise.all");

  const [leagueStats, recentWishlistItems] = await Promise.all([
    prisma.$queryRaw<Array<{ league_name: string; count: number }>>`
        SELECT 
        l.name as league_name,
        COUNT(*)::int as count
      FROM user_jerseys uj
      JOIN jerseys j ON uj."jerseyId" = j.id
      JOIN clubs c ON j."clubId" = c.id
      JOIN leagues l ON c."leagueId" = l.id
      WHERE uj."userId" = ${userId}
      GROUP BY l.name
    `,

    prisma.wishlist.findMany({
      where: { userId },
      select: {
        id: true,
        createdAt: true,
        jersey: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            type: true,
            club: {
              select: {
                id: true,
                name: true,
                shortName: true,
                league: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  console.timeEnd("⏱️ getUserStats - Second Promise.all");
  console.log(
    `📊 getUserStats - Leagues: ${leagueStats.length}, Recent wishlist: ${recentWishlistItems.length}`
  );
  console.time("⏱️ getUserStats - Data Processing");

  const leagueStatsObject: Record<string, number> = {};
  leagueStats.forEach((stat) => {
    leagueStatsObject[stat.league_name] = stat.count;
  });

  const formattedRecentCollection = recentCollectionItems.map((item) => ({
    id: item.id,
    jersey: {
      id: item.jersey.id,
      name: item.jersey.name,
      imageUrl: item.jersey.imageUrl,
      type: item.jersey.type,
      club: {
        id: item.jersey.club.id,
        name: item.jersey.club.name,
        shortName: item.jersey.club.shortName,
        league: {
          id: item.jersey.club.league.id,
          name: item.jersey.club.league.name,
        },
      },
    },
    purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
    createdAt: item.createdAt.toISOString(),
  }));

  const formattedRecentWishlist = recentWishlistItems.map((item) => ({
    id: item.id,
    jersey: {
      id: item.jersey.id,
      name: item.jersey.name,
      imageUrl: item.jersey.imageUrl,
      type: item.jersey.type,
      club: {
        id: item.jersey.club.id,
        name: item.jersey.club.name,
        shortName: item.jersey.club.shortName,
        league: {
          id: item.jersey.club.league.id,
          name: item.jersey.club.league.name,
        },
      },
    },
    createdAt: item.createdAt.toISOString(),
  }));

  console.timeEnd("⏱️ getUserStats - Data Processing");
  console.timeEnd("⏱️ getUserStats - Total");

  return {
    collection: {
      total: collectionStats._count.id || 0,
      totalValue: collectionStats._sum.purchasePrice
        ? Number(collectionStats._sum.purchasePrice)
        : null,
      recentItems: formattedRecentCollection,
      leagueStats: leagueStatsObject,
    },
    wishlist: {
      total: wishlistStats._count.id || 0,
      recentItems: formattedRecentWishlist,
    },
  };
}

async function getHomeData(userId?: string): Promise<{
  topRatedJerseys: TopRatedJersey[];
  recentJerseys: RecentJersey[];
  userStats: UserHomeStats | null;
}> {
  console.time("⏱️ getHomeData - Total");
  console.time("⏱️ getHomeData - Promise.allSettled");

  try {
    const [topRes, recentRes, userRes] = await Promise.allSettled([
      getTopRatedJerseys(),
      getRecentJerseys(),
      userId ? getUserStats(userId) : Promise.resolve(null),
    ]);

    console.timeEnd("⏱️ getHomeData - Promise.allSettled");
    console.time("⏱️ getHomeData - Result Processing");

    const topRatedJerseys = topRes.status === "fulfilled" ? topRes.value : [];
    const recentJerseys =
      recentRes.status === "fulfilled" ? recentRes.value : [];
    const userStats = userRes.status === "fulfilled" ? userRes.value : null;

    // Log des erreurs si nécessaire
    if (topRes.status === "rejected") {
      console.error("❌ getTopRatedJerseys failed:", topRes.reason);
    }
    if (recentRes.status === "rejected") {
      console.error("❌ getRecentJerseys failed:", recentRes.reason);
    }
    if (userRes.status === "rejected") {
      console.error("❌ getUserStats failed:", userRes.reason);
    }

    console.timeEnd("⏱️ getHomeData - Result Processing");
    console.timeEnd("⏱️ getHomeData - Total");
    console.log("🏁 HomePage data loading complete");

    return { topRatedJerseys, recentJerseys, userStats };
  } catch (error) {
    console.error("❌ Home data error:", error);
    console.timeEnd("⏱️ getHomeData - Promise.allSettled");
    console.timeEnd("⏱️ getHomeData - Total");
    return { topRatedJerseys: [], recentJerseys: [], userStats: null };
  }
}

export default async function HomePage() {
  console.time("⏱️ HomePage - Total Render");
  console.time("⏱️ HomePage - Get Current User");

  const user = await getCurrentUser();

  console.timeEnd("⏱️ HomePage - Get Current User");
  console.log(`👤 User: ${user ? `${user.id} (connecté)` : "non connecté"}`);

  const { topRatedJerseys, recentJerseys, userStats } = await getHomeData(
    user?.id
  );

  console.timeEnd("⏱️ HomePage - Total Render");
  console.log("=====================================");

  return (
    <div className="min-h-screen">
      <HeroSection
        user={user}
        userStats={
          userStats
            ? {
                collection: { total: userStats.collection.total },
                wishlist: { total: userStats.wishlist.total },
              }
            : null
        }
      />

      {user && userStats && <UserStatsSection userStats={userStats} />}
      <TopRatedSection jerseys={topRatedJerseys} />
      <RecentSection jerseys={recentJerseys} />
    </div>
  );
}
