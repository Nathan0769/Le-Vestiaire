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

    const dynamicRoutes: MetadataRoute.Sitemap = [];

    leagues.forEach((league) => {
      dynamicRoutes.push({
        url: `${baseUrl}/jerseys/${league.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });

      league.clubs.forEach((club) => {
        dynamicRoutes.push({
          url: `${baseUrl}/jerseys/${league.id}/clubs/${club.id}`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.7,
        });
      });
    });

    return [...staticRoutes, ...dynamicRoutes];
  } catch (error) {
    console.error("Erreur génération sitemap:", error);
    return [];
  }
}
