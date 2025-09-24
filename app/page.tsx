import { getCurrentUser } from "@/lib/get-current-user";
import { HeroSection } from "@/components/home/hero-section";
import { UserStatsSection } from "@/components/home/user-stats-section";
import { TopRatedSection } from "@/components/home/top-rated-section";
import { RecentSection } from "@/components/home/recent-section";
import prisma from "@/lib/prisma";
import type { TopRatedJersey, RecentJersey, UserHomeStats } from "@/types/home";

export const revalidate = 3600;

type TopRatedRow = {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  season: string;
  brand: string;
  club_id: string;
  club_name: string;
  club_short_name: string;
  club_logo_url: string | null;
  club_primary_color: string | null;
  league_id: string | null;
  league_name: string | null;
  league_country: string | null;
  league_logo_url: string | null;
  league_tier: number | null;
  average_rating: number;
  total_ratings: number;
};

async function getTopRatedJerseys(): Promise<TopRatedJersey[]> {
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
LIMIT 6;

  `;

  return rows.map(
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
}

async function getRecentJerseys(): Promise<RecentJersey[]> {
  const recentJerseys = await prisma.jersey.findMany({
    select: {
      id: true,
      name: true,
      imageUrl: true,
      type: true,
      season: true,
      brand: true,
      createdAt: true,
      club: {
        select: {
          id: true,
          name: true,
          shortName: true,
          leagueId: true,
          logoUrl: true,
          primaryColor: true,
          league: {
            select: {
              id: true,
              name: true,
              country: true,
              logoUrl: true,
              tier: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return recentJerseys.map((jersey) => ({
    ...jersey,
    createdAt: jersey.createdAt.toISOString(),
  }));
}

async function getUserStats(userId: string): Promise<UserHomeStats> {
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
  try {
    const [topRes, recentRes, userRes] = await Promise.allSettled([
      getTopRatedJerseys(),
      getRecentJerseys(),
      userId ? getUserStats(userId) : Promise.resolve(null),
    ]);

    const topRatedJerseys = topRes.status === "fulfilled" ? topRes.value : [];
    const recentJerseys =
      recentRes.status === "fulfilled" ? recentRes.value : [];
    const userStats = userRes.status === "fulfilled" ? userRes.value : null;

    return { topRatedJerseys, recentJerseys, userStats };
  } catch (error) {
    console.error("Home data error:", error);
    return { topRatedJerseys: [], recentJerseys: [], userStats: null };
  }
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const { topRatedJerseys, recentJerseys, userStats } = await getHomeData(
    user?.id
  );

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
