import { getCurrentUser } from "@/lib/get-current-user";
import { HeroSection } from "@/components/home/hero-section";
import { UserStatsSection } from "@/components/home/user-stats-section";
import { TopRatedSection } from "@/components/home/top-rated-section";
import { RecentSection } from "@/components/home/recent-section";
import { UserHomeStats } from "@/types/home";
import prisma from "@/lib/prisma";
import { $Enums } from "@prisma/client";

async function getHomeData(userId?: string) {
  const [topRatedData, recentData, userStatsData] = await Promise.allSettled([
    prisma.jersey.findMany({
      include: {
        club: { include: { league: true } },
        _count: { select: { ratings: true } },
        ratings: { select: { rating: true } },
      },
      take: 18,
    }),

    prisma.jersey.findMany({
      include: { club: { include: { league: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),

    userId
      ? prisma.$transaction([
          prisma.userJersey.count({ where: { userId } }),

          prisma.wishlist.count({ where: { userId } }),

          prisma.userJersey.findMany({
            where: { userId },
            include: {
              jersey: {
                include: { club: { include: { league: true } } },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 3,
          }),

          prisma.wishlist.findMany({
            where: { userId },
            include: {
              jersey: {
                include: { club: { include: { league: true } } },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 3,
          }),

          prisma.userJersey.aggregate({
            where: { userId, purchasePrice: { not: null } },
            _sum: { purchasePrice: true },
          }),
        ])
      : Promise.resolve(null),
  ]);

  let topRatedJerseys: {
    averageRating: number;
    totalRatings: number;
    // Convert Decimal to number
    retailPrice: number | null;
    club: {
      league: {
        id: string;
        name: string;
        logoUrl: string;
        country: string;
        tier: number;
      };
    } & {
      id: string;
      name: string;
      shortName: string;
      leagueId: string;
      logoUrl: string;
      primaryColor: string;
    };
    ratings: { rating: number }[];
    _count: { ratings: number };
    id: string;
    name: string;
    clubId: string;
    season: string;
    type: $Enums.JerseyType;
    brand: string;
    imageUrl: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[] = [];
  if (topRatedData.status === "fulfilled") {
    const jerseysWithStats = topRatedData.value
      .map((jersey) => {
        const totalRatings = jersey.ratings.length;
        const averageRating =
          totalRatings > 0
            ? jersey.ratings.reduce((sum, r) => sum + r.rating, 0) /
              totalRatings
            : 0;

        return {
          ...jersey,
          averageRating: Math.round(averageRating * 10) / 10,
          totalRatings,
          // Convert Decimal to number
          retailPrice: jersey.retailPrice ? Number(jersey.retailPrice) : null,
        };
      })
      .filter((jersey) => jersey.totalRatings >= 1)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 6);

    topRatedJerseys = jerseysWithStats;
  }

  let recentJerseys: {
    retailPrice: number | null;
    club: {
      league: {
        id: string;
        name: string;
        logoUrl: string;
        country: string;
        tier: number;
      };
    } & {
      id: string;
      name: string;
      shortName: string;
      leagueId: string;
      logoUrl: string;
      primaryColor: string;
    };
    id: string;
    name: string;
    type: $Enums.JerseyType;
    clubId: string;
    season: string;
    brand: string;
    imageUrl: string;
    description: string | null;
    createdAt: string;
    updatedAt: Date;
  }[] = [];
  if (recentData.status === "fulfilled") {
    recentJerseys = recentData.value.map((jersey) => ({
      ...jersey,
      retailPrice: jersey.retailPrice ? Number(jersey.retailPrice) : null,
      createdAt:
        typeof jersey.createdAt === "string"
          ? jersey.createdAt
          : jersey.createdAt.toISOString(),
    }));
  }

  let userStats: UserHomeStats | null = null;
  if (userStatsData.status === "fulfilled" && userStatsData.value) {
    const [
      collectionCount,
      wishlistCount,
      collectionItems,
      wishlistItems,
      totalValue,
    ] = userStatsData.value;

    const leagueCount = collectionItems.reduce((acc, item) => {
      const leagueName = item.jersey.club.league.name;
      acc[leagueName] = (acc[leagueName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    userStats = {
      collection: {
        total: collectionCount,
        totalValue: totalValue._sum.purchasePrice
          ? Number(totalValue._sum.purchasePrice)
          : null,
        recentItems: collectionItems.map((item) => ({
          id: item.id,
          jersey: {
            id: item.jersey.id,
            name: item.jersey.name,
            imageUrl: item.jersey.imageUrl,
            type: item.jersey.type,
            club: item.jersey.club,
          },
          purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
          createdAt: item.createdAt.toISOString(),
        })),
        leagueStats: leagueCount,
      },
      wishlist: {
        total: wishlistCount,
        recentItems: wishlistItems.map((item) => ({
          id: item.id,
          jersey: {
            id: item.jersey.id,
            name: item.jersey.name,
            imageUrl: item.jersey.imageUrl,
            type: item.jersey.type,
            club: item.jersey.club,
          },
          createdAt: item.createdAt.toISOString(),
        })),
      },
    };
  }

  return {
    topRatedJerseys,
    recentJerseys,
    userStats,
  };
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
