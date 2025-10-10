import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://le-vestiaire-foot.fr";

  try {
    const staticRoutes: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 1,
      },
      {
        url: `${baseUrl}/jerseys`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/collection`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/wishlist`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      },
      {
        url: `${baseUrl}/settings`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.3,
      },
      {
        url: `${baseUrl}/authentification`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.4,
      },
    ];

    const leagues = await prisma.league.findMany({
      include: {
        clubs: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
      },
    });

    const leagueAndClubRoutes: MetadataRoute.Sitemap = [];

    leagues.forEach((league) => {
      leagueAndClubRoutes.push({
        url: `${baseUrl}/jerseys/${league.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });

      league.clubs.forEach((club) => {
        leagueAndClubRoutes.push({
          url: `${baseUrl}/jerseys/${league.id}/clubs/${club.id}`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.7,
        });
      });
    });

    const jerseys = await prisma.jersey.findMany({
      select: {
        slug: true,
        updatedAt: true,
        club: {
          select: {
            id: true,
            league: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      where: {
        slug: {
          not: null,
        },
      },
    });

    const jerseyRoutes: MetadataRoute.Sitemap = jerseys.map((jersey) => ({
      url: `${baseUrl}/jerseys/${jersey.club.league.id}/clubs/${jersey.club.id}/jerseys/${jersey.slug}`,
      lastModified: jersey.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    console.log(`✅ Sitemap généré : ${jerseyRoutes.length} maillots`);

    return [...staticRoutes, ...leagueAndClubRoutes, ...jerseyRoutes];
  } catch (error) {
    console.error("❌ Erreur génération sitemap:", error);
    return [];
  }
}
