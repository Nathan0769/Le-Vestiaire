import { getCurrentUser } from "@/lib/get-current-user";
import { HeroSection } from "@/components/home/hero-section";
import { UserStatsSection } from "@/components/home/user-stats-section";
import { TopRatedSection } from "@/components/home/top-rated-section";
import { RecentSection } from "@/components/home/recent-section";
import prisma from "@/lib/prisma";
import type { TopRatedJersey, RecentJersey, UserHomeStats } from "@/types/home";

export const revalidate = 3600;

async function getTopRatedJerseys(): Promise<TopRatedJersey[]> {
  const topRated = await prisma.jersey.findMany({
    select: {
      id: true,
      name: true,
      imageUrl: true,
      type: true,
      season: true,
      brand: true,
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
      ratings: {
        select: {
          rating: true,
        },
      },
    },
    where: {
      ratings: {
        some: {},
      },
    },
    take: 10,
  });

  const jerseysWithRatings = topRated.map((jersey) => {
    const ratings = jersey.ratings.map((r) => Number(r.rating));
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

    return {
      id: jersey.id,
      name: jersey.name,
      imageUrl: jersey.imageUrl,
      type: jersey.type,
      season: jersey.season,
      brand: jersey.brand,
      club: {
        id: jersey.club.id,
        name: jersey.club.name,
        shortName: jersey.club.shortName,
        leagueId: jersey.club.leagueId,
        logoUrl: jersey.club.logoUrl,
        primaryColor: jersey.club.primaryColor,
        league: jersey.club.league,
      },
      averageRating: Number(avgRating.toFixed(2)),
      totalRatings: ratings.length,
    };
  });

  return jerseysWithRatings
    .sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      return b.totalRatings - a.totalRatings;
    })
    .slice(0, 6);
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
