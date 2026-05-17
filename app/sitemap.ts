import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

const BASE_URL = "https://le-vestiaire-foot.fr";
const LOCALES = ["fr", "en", "es", "de", "pt"] as const;

function staticLocalizedEntries(
  path: string,
  opts: {
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }
): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `${BASE_URL}/${locale}${path}`,
    lastModified: new Date(),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Static pages: list all 5 locales so Google crawls de/pt
    const staticRoutes: MetadataRoute.Sitemap = [
      ...staticLocalizedEntries("", { changeFrequency: "weekly", priority: 1 }),
      ...staticLocalizedEntries("/jerseys", {
        changeFrequency: "daily",
        priority: 0.9,
      }),
      ...staticLocalizedEntries("/authentification", {
        changeFrequency: "monthly",
        priority: 0.75,
      }),
      ...staticLocalizedEntries("/authentification/adidas", {
        changeFrequency: "monthly",
        priority: 0.75,
      }),
      ...staticLocalizedEntries("/authentification/nike", {
        changeFrequency: "monthly",
        priority: 0.75,
      }),
      ...staticLocalizedEntries("/authentification/puma", {
        changeFrequency: "monthly",
        priority: 0.65,
      }),
      ...staticLocalizedEntries("/authentification/hummel", {
        changeFrequency: "monthly",
        priority: 0.55,
      }),
    ];

    const leagues = await prisma.league.findMany({
      include: {
        clubs: {
          select: { id: true },
        },
      },
    });

    // Dynamic pages: French only — hreflang in HTML handles other locales
    const leagueAndClubRoutes: MetadataRoute.Sitemap = [];

    leagues.forEach((league) => {
      leagueAndClubRoutes.push({
        url: `${BASE_URL}/fr/jerseys/${league.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });

      league.clubs.forEach((club) => {
        leagueAndClubRoutes.push({
          url: `${BASE_URL}/fr/jerseys/${league.id}/clubs/${club.id}`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.7,
        });
      });
    });

    const jerseys = await prisma.jersey.findMany({
      select: {
        slug: true,
        imageUrl: true,
        updatedAt: true,
        club: {
          select: {
            id: true,
            league: {
              select: { id: true },
            },
          },
        },
      },
      where: { slug: { not: null } },
    });

    const jerseyRoutes: MetadataRoute.Sitemap = jerseys.map((jersey) => ({
      url: `${BASE_URL}/fr/jerseys/${jersey.club.league.id}/clubs/${jersey.club.id}/jerseys/${jersey.slug}`,
      lastModified: jersey.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
      images: jersey.imageUrl ? [jersey.imageUrl] : undefined,
    }));

    console.log(
      `Sitemap généré : ${jerseyRoutes.length} maillots + ${leagueAndClubRoutes.length} leagues/clubs + ${staticRoutes.length} pages statiques`
    );

    return [...staticRoutes, ...leagueAndClubRoutes, ...jerseyRoutes];
  } catch (error) {
    console.error("Erreur génération sitemap:", error);
    return [];
  }
}
