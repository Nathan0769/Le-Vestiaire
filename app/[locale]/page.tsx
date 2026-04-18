import type { Metadata } from "next";
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
import { FAQSection } from "@/components/home/faq-section";
import { FeaturesSection } from "@/components/home/features-section";
import { StatsSection } from "@/components/home/stats-section";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const localeMap: Record<string, string> = {
    fr: "fr_FR",
    en: "en_US",
    es: "es_ES",
  };

  const titles: Record<string, string> = {
    fr: "Le Vestiaire Foot - Gérez votre Collection de Maillots de Football",
    en: "The Locker Room - Manage Your Football Jersey Collection",
    es: "El Vestuario - Gestiona tu Colección de Camisetas de Fútbol",
  };

  const descriptions: Record<string, string> = {
    fr: "Rejoignez des milliers de collectionneurs : cataloguez vos maillots de football, créez une wishlist partageable, notez les maillots de votre club et découvrez les pièces les mieux notées par la communauté.",
    en: "Join thousands of collectors: catalog your football jerseys, create a shareable wishlist, rate jerseys from your club, and discover the community's top-rated pieces.",
    es: "Únete a miles de coleccionistas: cataloga tus camisetas de fútbol, crea una lista de deseos para compartir, puntúa camisetas de tu club y descubre las mejor valoradas por la comunidad.",
  };

  const keywords: Record<string, string> = {
    fr: "collection maillots football, application maillots foot, cataloguer maillots foot, wishlist maillots football, noter maillots football, collectionneurs maillots, maillots vintage football, le vestiaire foot, gérer collection foot",
    en: "football jersey collection, jersey collection app, football shirt wishlist, rate football jerseys, jersey collectors, vintage football shirts, manage jersey collection",
    es: "colección camisetas fútbol, app camisetas fútbol, wishlist camisetas fútbol, valorar camisetas fútbol, coleccionistas camisetas fútbol",
  };

  return {
    title: titles[locale] || titles.fr,
    description: descriptions[locale] || descriptions.fr,
    keywords: keywords[locale] || keywords.fr,
    applicationName: "Le Vestiaire Foot",
    openGraph: {
      title: titles[locale] || titles.fr,
      description: descriptions[locale] || descriptions.fr,
      url: `https://le-vestiaire-foot.fr/${locale}`,
      siteName: "Le Vestiaire Foot",
      images: [
        {
          url: "https://le-vestiaire-foot.fr/icon.png",
          width: 1200,
          height: 630,
          alt: "Le Vestiaire Foot - Collection de maillots de football",
        },
      ],
      locale: localeMap[locale] || "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titles[locale] || titles.fr,
      description: descriptions[locale] || descriptions.fr,
      images: ["https://le-vestiaire-foot.fr/icon.png"],
    },
    alternates: {
      canonical: `https://le-vestiaire-foot.fr/${locale}`,
      languages: {
        fr: "https://le-vestiaire-foot.fr/fr",
        en: "https://le-vestiaire-foot.fr/en",
        es: "https://le-vestiaire-foot.fr/es",
      },
    },
  };
}

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
LIMIT 6`;

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

  return result;
}

async function getRecentJerseys(): Promise<RecentJersey[]> {
  const jerseys = (await prisma.$queryRaw`
   WITH latest_jerseys AS (
  SELECT id, name, "imageUrl", type, season, brand, "createdAt", "clubId"
  FROM jerseys
  ORDER BY "createdAt" DESC
  LIMIT 6
)
SELECT
    j.id, j.name, j."imageUrl", j.type, j.season, j.brand, j."createdAt",
    c.id AS club_id, c.name AS club_name, c."shortName" AS club_short_name,
    l.id AS league_id, l.name AS league_name
FROM latest_jerseys j
JOIN clubs c ON j."clubId" = c.id
JOIN leagues l ON c."leagueId" = l.id
ORDER BY j."createdAt" DESC;

  `) as RawResult[];

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
        shortName: j.club_short_name,
        league: {
          id: j.league_id,
          name: j.league_name || "N/A",
        },
      },
    })
  );
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
              season: true,
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
            season: true,
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
      season: item.jersey.season,
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
      season: item.jersey.season,
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

async function getGlobalStats(): Promise<{
  userCount: number;
  jerseyCount: number;
  clubCount: number;
}> {
  const [userCount, jerseyCount, clubCount] = await Promise.all([
    prisma.user.count(),
    prisma.jersey.count(),
    prisma.club.count(),
  ]);
  return { userCount, jerseyCount, clubCount };
}

async function getHomeData(userId?: string): Promise<{
  topRatedJerseys: TopRatedJersey[];
  recentJerseys: RecentJersey[];
  userStats: UserHomeStats | null;
  globalStats: { userCount: number; jerseyCount: number; clubCount: number };
}> {
  try {
    const [topRes, recentRes, userRes, statsRes] = await Promise.allSettled([
      getTopRatedJerseys(),
      getRecentJerseys(),
      userId ? getUserStats(userId) : Promise.resolve(null),
      getGlobalStats(),
    ]);

    const topRatedJerseys = topRes.status === "fulfilled" ? topRes.value : [];
    const recentJerseys =
      recentRes.status === "fulfilled" ? recentRes.value : [];
    const userStats = userRes.status === "fulfilled" ? userRes.value : null;
    const globalStats =
      statsRes.status === "fulfilled"
        ? statsRes.value
        : { userCount: 0, jerseyCount: 0, clubCount: 0 };

    if (topRes.status === "rejected") {
      console.error("❌ getTopRatedJerseys failed:", topRes.reason);
    }
    if (recentRes.status === "rejected") {
      console.error("❌ getRecentJerseys failed:", recentRes.reason);
    }
    if (userRes.status === "rejected") {
      console.error("❌ getUserStats failed:", userRes.reason);
    }
    if (statsRes.status === "rejected") {
      console.error("❌ getGlobalStats failed:", statsRes.reason);
    }

    return { topRatedJerseys, recentJerseys, userStats, globalStats };
  } catch (error) {
    console.error("❌ Home data error:", error);

    return {
      topRatedJerseys: [],
      recentJerseys: [],
      userStats: null,
      globalStats: { userCount: 0, jerseyCount: 0, clubCount: 0 },
    };
  }
}

export default async function HomePage() {
  const user = await getCurrentUser();

  const { topRatedJerseys, recentJerseys, userStats, globalStats } =
    await getHomeData(user?.id);

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Le Vestiaire Foot",
    url: "https://le-vestiaire-foot.fr",
    description:
      "Application gratuite pour gérer et partager votre collection de maillots de football.",
    applicationCategory: "SportsApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    featureList: [
      "Gestion de collection de maillots",
      "Wishlist partageable",
      "Notation communautaire des maillots",
      "Authentification maillots (supporter vs pro)",
      "Leaderboard des collectionneurs",
    ],
  };

  const itemListSchema =
    topRatedJerseys.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Maillots de football les mieux notés",
          description:
            "Les maillots de football les mieux notés par la communauté Le Vestiaire",
          numberOfItems: topRatedJerseys.length,
          itemListElement: topRatedJerseys.map((jersey, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: `${jersey.name} - ${jersey.club.name} ${jersey.season}`,
            url: `https://le-vestiaire-foot.fr/jerseys/${jersey.club.league.id}/clubs/${jersey.club.id}/jerseys/${jersey.id}`,
            item: {
              "@type": "Product",
              name: `${jersey.name} - ${jersey.club.name}`,
              description: `Maillot ${jersey.club.name} saison ${jersey.season} par ${jersey.brand}`,
              ...(jersey.imageUrl && { image: jersey.imageUrl }),
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: jersey.averageRating.toFixed(1),
                reviewCount: jersey.totalRatings,
                bestRating: "5",
                worstRating: "0.5",
              },
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
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

      <StatsSection
        userCount={globalStats.userCount}
        jerseyCount={globalStats.jerseyCount}
        clubCount={globalStats.clubCount}
      />
      <FeaturesSection />
      <FAQSection />
    </div>
    </>
  );
}
