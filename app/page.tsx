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
  CollectionStatsRow,
  WishlistStatsRow,
  LeagueStatsRow,
} from "@/types/home";

async function getTopRatedJerseys(): Promise<TopRatedJersey[]> {
  const topRated = await prisma.$queryRaw<TopRatedRow[]>`
    SELECT 
      j.id, j.name, j."imageUrl", j.type, j.season, j.brand,
      c.id as club_id, c.name as club_name, c."shortName", c."logoUrl", c."primaryColor",
      l.id as league_id, l.name as league_name, l.country, l."logoUrl" as league_logo, l.tier,
      COALESCE(AVG(r.rating)::numeric(3,2), 0) as average_rating,
      COUNT(r.rating)::int as total_ratings
    FROM jerseys j
    JOIN clubs c ON j."clubId" = c.id
    JOIN leagues l ON c."leagueId" = l.id
    LEFT JOIN ratings r ON j.id = r."jerseyId"
    GROUP BY j.id, c.id, l.id
    HAVING COUNT(r.rating) >= 1
    ORDER BY average_rating DESC, total_ratings DESC
    LIMIT 6
  `;

  return topRated.map(
    (row): TopRatedJersey => ({
      id: row.id,
      name: row.name,
      imageUrl: row.imageUrl,
      type: row.type,
      season: row.season,
      brand: row.brand,
      club: {
        id: row.club_id,
        name: row.club_name,
        shortName: row.shortName,
        leagueId: row.league_id,
        logoUrl: row.logoUrl,
        primaryColor: row.primaryColor,
        league: {
          id: row.league_id,
          name: row.league_name,
          country: row.country,
          logoUrl: row.league_logo,
          tier: row.tier,
        },
      },
      averageRating: Number(row.average_rating ?? 0),
      totalRatings: Number(row.total_ratings),
    })
  );
}

type RecentJerseyDb = Omit<RecentJersey, "createdAt"> & { createdAt: Date };

async function getRecentJerseys(): Promise<RecentJerseyDb[]> {
  return await prisma.jersey.findMany({
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
}

async function getUserStats(userId: string): Promise<UserHomeStats> {
  const [
    collectionStats,
    wishlistStats,
    leagueStats,
    recentCollectionItems,
    recentWishlistItems,
  ] = await Promise.all([
    prisma.$queryRaw<CollectionStatsRow[]>`
      SELECT 
        COUNT(*)::int as total,
        COALESCE(SUM("purchasePrice"), 0) as total_value
      FROM user_jerseys 
      WHERE "userId" = ${userId}
    `,

    prisma.$queryRaw<WishlistStatsRow[]>`
      SELECT COUNT(*)::int as total
      FROM wishlist 
      WHERE "userId" = ${userId}
    `,

    prisma.$queryRaw<LeagueStatsRow[]>`
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

  const collectionData = collectionStats[0];
  const wishlistData = wishlistStats[0];

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
      total: collectionData?.total || 0,
      totalValue: collectionData?.total_value
        ? Number(collectionData.total_value)
        : null,
      recentItems: formattedRecentCollection,
      leagueStats: leagueStatsObject,
    },
    wishlist: {
      total: wishlistData?.total || 0,
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

    const recentJerseys: RecentJersey[] =
      recentRes.status === "fulfilled"
        ? recentRes.value.map((jersey) => ({
            ...jersey,
            createdAt: jersey.createdAt.toISOString(),
          }))
        : [];

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
