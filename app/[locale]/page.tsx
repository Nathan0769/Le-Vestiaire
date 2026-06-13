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
import { CfsPromoSection } from "@/components/home/cfs-promo-section";

export const dynamic = "force-dynamic";

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
    de: "de_DE",
    pt: "pt_PT",
  };

  const titles: Record<string, string> = {
    fr: "Le Vestiaire Foot - Gérez votre Collection de Maillots de Football",
    en: "The Locker Room - Manage Your Football Jersey Collection",
    es: "El Vestuario - Gestiona tu Colección de Camisetas de Fútbol",
    de: "Le Vestiaire Foot - Verwalte deine Fußballtrikot-Sammlung",
    pt: "Le Vestiaire Foot - Gere a tua Coleção de Camisolas de Futebol",
  };

  const descriptions: Record<string, string> = {
    fr: "Rejoignez des milliers de collectionneurs : cataloguez vos maillots de football, créez une wishlist partageable, notez les maillots de votre club et découvrez les pièces les mieux notées par la communauté.",
    en: "Join thousands of collectors: catalog your football jerseys, create a shareable wishlist, rate jerseys from your club, and discover the community's top-rated pieces.",
    es: "Únete a miles de coleccionistas: cataloga tus camisetas de fútbol, crea una lista de deseos para compartir, puntúa camisetas de tu club y descubre las mejor valoradas por la comunidad.",
    de: "Schließ dich tausenden Sammlern an: katalogisiere deine Fußballtrikots, erstelle eine teilbare Wunschliste, bewerte Trikots deines Clubs und entdecke die bestbewerteten Stücke der Community.",
    pt: "Junta-te a milhares de colecionadores: cataloga as tuas camisolas de futebol, cria uma lista de desejos partilhável, avalia camisolas do teu clube e descobre as peças mais bem avaliadas da comunidade.",
  };

  const keywords: Record<string, string> = {
    fr: "collection maillots football, application maillots foot, cataloguer maillots foot, wishlist maillots football, noter maillots football, collectionneurs maillots, maillots vintage football, le vestiaire foot, gérer collection foot",
    en: "football jersey collection, jersey collection app, football shirt wishlist, rate football jerseys, jersey collectors, vintage football shirts, manage jersey collection",
    es: "colección camisetas fútbol, app camisetas fútbol, wishlist camisetas fútbol, valorar camisetas fútbol, coleccionistas camisetas fútbol",
    de: "Fußballtrikot Sammlung, Trikot Sammlung App, Fußballtrikot Wunschliste, Trikots bewerten, Trikot Sammler, vintage Fußballtrikots, Trikot Sammlung verwalten",
    pt: "coleção camisolas futebol, app camisolas futebol, lista de desejos camisolas futebol, avaliar camisolas futebol, colecionadores camisolas futebol",
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
        de: "https://le-vestiaire-foot.fr/de",
        pt: "https://le-vestiaire-foot.fr/pt",
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
  j.variant,
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
      variant: Number(r.variant) || 1,
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
  SELECT id, name, "imageUrl", type, variant, season, brand, "createdAt", "clubId"
  FROM jerseys
  ORDER BY "createdAt" DESC
  LIMIT 6
)
SELECT
    j.id, j.name, j."imageUrl", j.type, j.variant, j.season, j.brand, j."createdAt",
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
      variant: Number(j.variant) || 1,
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

async function getCfsPromos() {
  try {
    return await prisma.cfsPromo.findMany({
      where: { isActive: true },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        imageUrl: true,
        price: true,
        promoPrice: true,
        affiliateUrl: true,
        club: true,
        brand: true,
        source: true,
        sizes: true,
      },
    });
  } catch {
    return [];
  }
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

const schemaContent: Record<
  string,
  {
    appDescription: string;
    featureList: string[];
    orgDescription: string;
    faq: Array<{ q: string; a: string }>;
  }
> = {
  fr: {
    appDescription:
      "Le Vestiaire Foot est une application web gratuite permettant aux collectionneurs de maillots de football de cataloguer leur collection, créer une wishlist partageable, authentifier leurs maillots et rejoindre une communauté de passionnés.",
    featureList: [
      "Catalogage de maillots de football avec détails (taille, état, prix d'achat, personnalisation)",
      "Wishlist partageable pour Noël et anniversaires",
      "Guides d'authentification des maillots (Nike, Adidas, Puma)",
      "Communauté de collectionneurs et partage de collections",
      "Classement des maillots les mieux notés",
    ],
    orgDescription:
      "Plateforme communautaire gratuite dédiée aux collectionneurs de maillots de football, permettant de cataloguer, noter, authentifier et partager des collections de maillots.",
    faq: [
      {
        q: "Comment ajouter un maillot à ma collection ?",
        a: "Pour ajouter un maillot à votre collection sur Le Vestiaire Foot, créez un compte gratuit, accédez à la section « Ma Collection » et sélectionnez le maillot dans le catalogue. Vous pouvez renseigner la taille, l'état, le prix d'achat et la personnalisation pour chaque maillot afin de suivre précisément la valeur de votre collection.",
      },
      {
        q: "Puis-je partager ma wishlist pour Noël ou mon anniversaire ?",
        a: "Oui. Le Vestiaire Foot permet de créer une wishlist de maillots de football et de la partager avec vos proches via un lien direct. C'est la solution idéale pour que vos amis sachent exactement quels maillots vous souhaitez recevoir pour Noël, un anniversaire ou toute occasion spéciale.",
      },
      {
        q: "Comment reconnaître un faux maillot de football ?",
        a: "Le Vestiaire Foot met à disposition des guides détaillés d'authentification pour chaque grande marque de maillots : Nike, Adidas, Puma et d'autres. Ces guides expliquent les points de contrôle essentiels — coutures, flocages, étiquettes, tissus — pour distinguer un maillot authentique d'une contrefaçon.",
      },
      {
        q: "Quels clubs et ligues sont disponibles sur Le Vestiaire Foot ?",
        a: "Le catalogue de Le Vestiaire Foot couvre de nombreuses compétitions internationales, dont la Ligue 1, la Bundesliga, les équipes nationales UEFA et AFC. De nouveaux clubs et sélections nationales sont régulièrement ajoutés au catalogue.",
      },
      {
        q: "Est-ce que mes données sont sécurisées ?",
        a: "Oui. Le Vestiaire Foot protège les données personnelles de ses utilisateurs. L'application utilise uniquement des cookies essentiels pour son fonctionnement, et des cookies d'analyse que vous pouvez refuser à tout moment. La politique complète est consultable sur la page dédiée.",
      },
    ],
  },
  en: {
    appDescription:
      "Le Vestiaire Foot is a free web app that lets football jersey collectors catalog their collection, create a shareable wishlist, authenticate jerseys and join a community of enthusiasts.",
    featureList: [
      "Football jersey cataloging with full details (size, condition, purchase price, customization)",
      "Shareable wishlist for Christmas and birthdays",
      "Jersey authentication guides (Nike, Adidas, Puma)",
      "Collector community and collection sharing",
      "Highest-rated jerseys ranking",
    ],
    orgDescription:
      "Free community platform dedicated to football jersey collectors, enabling cataloging, rating, authenticating and sharing jersey collections.",
    faq: [
      {
        q: "How do I add a jersey to my collection?",
        a: "To add a jersey to your collection on Le Vestiaire Foot, create a free account, go to the 'My Collection' section and select the jersey from the catalog. You can enter the size, condition, purchase price and customization for each jersey to precisely track the value of your collection.",
      },
      {
        q: "Can I share my wishlist for Christmas or my birthday?",
        a: "Yes. Le Vestiaire Foot lets you create a football jersey wishlist and share it with friends and family via a direct link. It's the ideal solution so they know exactly which jerseys you'd like to receive for Christmas, a birthday or any special occasion.",
      },
      {
        q: "How can I spot a fake football jersey?",
        a: "Le Vestiaire Foot provides detailed authentication guides for every major jersey brand: Nike, Adidas, Puma and others. These guides explain the key checkpoints — stitching, badges, labels, fabric — to distinguish an authentic jersey from a counterfeit.",
      },
      {
        q: "What clubs and leagues are available on Le Vestiaire Foot?",
        a: "The Le Vestiaire Foot catalog covers many international competitions, including Ligue 1, the Bundesliga, UEFA and AFC national teams. New clubs and national squads are regularly added to the catalog.",
      },
      {
        q: "Is my data secure?",
        a: "Yes. Le Vestiaire Foot protects its users' personal data. The app uses only essential cookies for operation, plus optional analytics cookies you can decline at any time. The full policy is available on the dedicated page.",
      },
    ],
  },
  es: {
    appDescription:
      "Le Vestiaire Foot es una aplicación web gratuita que permite a los coleccionistas de camisetas de fútbol catalogar su colección, crear una lista de deseos compartible, autenticar camisetas y unirse a una comunidad de apasionados.",
    featureList: [
      "Catalogación de camisetas de fútbol con detalles completos (talla, estado, precio de compra, personalización)",
      "Lista de deseos compartible para Navidad y cumpleaños",
      "Guías de autenticación de camisetas (Nike, Adidas, Puma)",
      "Comunidad de coleccionistas y compartición de colecciones",
      "Ranking de camisetas mejor valoradas",
    ],
    orgDescription:
      "Plataforma comunitaria gratuita dedicada a los coleccionistas de camisetas de fútbol, que permite catalogar, valorar, autenticar y compartir colecciones de camisetas.",
    faq: [
      {
        q: "¿Cómo añado una camiseta a mi colección?",
        a: "Para añadir una camiseta a tu colección en Le Vestiaire Foot, crea una cuenta gratuita, accede a la sección 'Mi Colección' y selecciona la camiseta del catálogo. Puedes introducir la talla, el estado, el precio de compra y la personalización de cada camiseta para seguir con precisión el valor de tu colección.",
      },
      {
        q: "¿Puedo compartir mi lista de deseos para Navidad o mi cumpleaños?",
        a: "Sí. Le Vestiaire Foot permite crear una lista de deseos de camisetas de fútbol y compartirla con familiares y amigos mediante un enlace directo. Es la solución ideal para que sepan exactamente qué camisetas te gustaría recibir en Navidad, un cumpleaños o cualquier ocasión especial.",
      },
      {
        q: "¿Cómo reconocer una camiseta de fútbol falsa?",
        a: "Le Vestiaire Foot pone a disposición guías detalladas de autenticación para cada gran marca de camisetas: Nike, Adidas, Puma y otras. Estas guías explican los puntos de control esenciales — costuras, escudos, etiquetas, tejidos — para distinguir una camiseta auténtica de una falsificación.",
      },
      {
        q: "¿Qué clubes y ligas están disponibles en Le Vestiaire Foot?",
        a: "El catálogo de Le Vestiaire Foot cubre numerosas competiciones internacionales, incluidas la Ligue 1, la Bundesliga y las selecciones nacionales de la UEFA y la AFC. Se añaden regularmente nuevos clubes y selecciones nacionales al catálogo.",
      },
      {
        q: "¿Están seguros mis datos?",
        a: "Sí. Le Vestiaire Foot protege los datos personales de sus usuarios. La aplicación utiliza únicamente cookies esenciales para su funcionamiento, además de cookies de análisis opcionales que puedes rechazar en cualquier momento. La política completa está disponible en la página dedicada.",
      },
    ],
  },
  de: {
    appDescription:
      "Le Vestiaire Foot ist eine kostenlose Web-App, mit der Fußballtrikot-Sammler ihre Sammlung katalogisieren, eine teilbare Wunschliste erstellen, Trikots authentifizieren und einer Gemeinschaft von Enthusiasten beitreten können.",
    featureList: [
      "Fußballtrikot-Katalogisierung mit vollständigen Details (Größe, Zustand, Kaufpreis, Personalisierung)",
      "Teilbare Wunschliste für Weihnachten und Geburtstage",
      "Trikot-Authentifizierungsführer (Nike, Adidas, Puma)",
      "Sammler-Community und Sammlungsaustausch",
      "Ranking der bestbewerteten Trikots",
    ],
    orgDescription:
      "Kostenlose Community-Plattform für Fußballtrikot-Sammler, die das Katalogisieren, Bewerten, Authentifizieren und Teilen von Trikotsammlungen ermöglicht.",
    faq: [
      {
        q: "Wie füge ich ein Trikot zu meiner Sammlung hinzu?",
        a: "Um ein Trikot zu deiner Sammlung bei Le Vestiaire Foot hinzuzufügen, erstelle ein kostenloses Konto, gehe zum Bereich 'Meine Sammlung' und wähle das Trikot aus dem Katalog. Du kannst Größe, Zustand, Kaufpreis und Personalisierung für jedes Trikot eingeben, um den Wert deiner Sammlung genau zu verfolgen.",
      },
      {
        q: "Kann ich meine Wunschliste für Weihnachten oder meinen Geburtstag teilen?",
        a: "Ja. Le Vestiaire Foot ermöglicht es dir, eine Fußballtrikot-Wunschliste zu erstellen und sie über einen direkten Link mit Freunden und Familie zu teilen. Das ist die ideale Lösung, damit sie genau wissen, welche Trikots du zu Weihnachten, einem Geburtstag oder einem besonderen Anlass erhalten möchtest.",
      },
      {
        q: "Wie erkenne ich ein gefälschtes Fußballtrikot?",
        a: "Le Vestiaire Foot bietet detaillierte Authentifizierungsführer für jede große Trikotmarke: Nike, Adidas, Puma und andere. Diese Führer erklären die wichtigsten Prüfpunkte — Nähte, Abzeichen, Etiketten, Stoffe — um ein authentisches Trikot von einer Fälschung zu unterscheiden.",
      },
      {
        q: "Welche Clubs und Ligen sind bei Le Vestiaire Foot verfügbar?",
        a: "Der Katalog von Le Vestiaire Foot umfasst viele internationale Wettbewerbe, darunter die Ligue 1, die Bundesliga sowie UEFA- und AFC-Nationalmannschaften. Neue Clubs und Nationalmannschaften werden regelmäßig zum Katalog hinzugefügt.",
      },
      {
        q: "Sind meine Daten sicher?",
        a: "Ja. Le Vestiaire Foot schützt die persönlichen Daten seiner Nutzer. Die App verwendet nur wesentliche Cookies für den Betrieb sowie optionale Analyse-Cookies, die du jederzeit ablehnen kannst. Die vollständige Richtlinie ist auf der entsprechenden Seite verfügbar.",
      },
    ],
  },
  pt: {
    appDescription:
      "Le Vestiaire Foot é uma aplicação web gratuita que permite aos colecionadores de camisolas de futebol catalogar a sua coleção, criar uma lista de desejos partilhável, autenticar camisolas e juntar-se a uma comunidade de entusiastas.",
    featureList: [
      "Catalogação de camisolas de futebol com detalhes completos (tamanho, estado, preço de compra, personalização)",
      "Lista de desejos partilhável para o Natal e aniversários",
      "Guias de autenticação de camisolas (Nike, Adidas, Puma)",
      "Comunidade de colecionadores e partilha de coleções",
      "Ranking das camisolas mais bem avaliadas",
    ],
    orgDescription:
      "Plataforma comunitária gratuita dedicada aos colecionadores de camisolas de futebol, que permite catalogar, avaliar, autenticar e partilhar coleções de camisolas.",
    faq: [
      {
        q: "Como adiciono uma camisola à minha coleção?",
        a: "Para adicionar uma camisola à tua coleção no Le Vestiaire Foot, cria uma conta gratuita, acede à secção 'A Minha Coleção' e seleciona a camisola no catálogo. Podes introduzir o tamanho, o estado, o preço de compra e a personalização de cada camisola para acompanhar com precisão o valor da tua coleção.",
      },
      {
        q: "Posso partilhar a minha lista de desejos para o Natal ou o meu aniversário?",
        a: "Sim. Le Vestiaire Foot permite criar uma lista de desejos de camisolas de futebol e partilhá-la com amigos e familiares através de um link direto. É a solução ideal para que saibam exatamente que camisolas gostavas de receber no Natal, num aniversário ou em qualquer ocasião especial.",
      },
      {
        q: "Como reconhecer uma camisola de futebol falsa?",
        a: "Le Vestiaire Foot disponibiliza guias detalhados de autenticação para cada grande marca de camisolas: Nike, Adidas, Puma e outras. Estes guias explicam os pontos de controlo essenciais — costuras, emblemas, etiquetas, tecidos — para distinguir uma camisola autêntica de uma falsificação.",
      },
      {
        q: "Que clubes e ligas estão disponíveis no Le Vestiaire Foot?",
        a: "O catálogo do Le Vestiaire Foot abrange muitas competições internacionais, incluindo a Ligue 1, a Bundesliga e as seleções nacionais da UEFA e da AFC. Novos clubes e seleções nacionais são regularmente adicionados ao catálogo.",
      },
      {
        q: "Os meus dados estão seguros?",
        a: "Sim. Le Vestiaire Foot protege os dados pessoais dos seus utilizadores. A aplicação utiliza apenas cookies essenciais para o seu funcionamento, bem como cookies de análise opcionais que podes recusar a qualquer momento. A política completa está disponível na página dedicada.",
      },
    ],
  },
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  const [{ topRatedJerseys, recentJerseys, userStats, globalStats }, cfsPromos] =
    await Promise.all([getHomeData(user?.id), getCfsPromos()]);

  const content = schemaContent[locale] ?? schemaContent.fr;
  const pageUrl = `https://le-vestiaire-foot.fr/${locale}`;

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Le Vestiaire Foot",
    url: pageUrl,
    applicationCategory: "SportsApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    description: content.appDescription,
    featureList: content.featureList,
    inLanguage: locale,
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Le Vestiaire Foot",
    url: pageUrl,
    description: content.orgDescription,
    inLanguage: locale,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
      <CfsPromoSection promos={cfsPromos.map((p) => ({
        ...p,
        price: p.price.toString(),
        promoPrice: p.promoPrice.toString(),
        source: p.source,
        sizes: p.sizes,
      }))} />

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
