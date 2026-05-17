import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

const BASE_URL = "https://le-vestiaire-foot.fr";
const LOCALES = ["fr", "en", "es", "de", "pt"] as const;

function localizedEntries(
  path: string,
  opts: {
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
    lastModified?: Date;
  }
): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `${BASE_URL}/${locale}${path}`,
    lastModified: opts.lastModified ?? new Date(),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `${BASE_URL}/${l}${path}`])
      ),
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const staticRoutes: MetadataRoute.Sitemap = [
      ...localizedEntries("", { changeFrequency: "weekly", priority: 1 }),
      ...localizedEntries("/jerseys", {
        changeFrequency: "daily",
        priority: 0.9,
      }),
      ...localizedEntries("/authentification", {
        changeFrequency: "monthly",
        priority: 0.75,
      }),
      ...localizedEntries("/authentification/adidas", {
        changeFrequency: "monthly",
        priority: 0.75,
      }),
      ...localizedEntries("/authentification/nike", {
        changeFrequency: "monthly",
        priority: 0.75,
      }),
      ...localizedEntries("/authentification/puma", {
        changeFrequency: "monthly",
        priority: 0.65,
      }),
      ...localizedEntries("/authentification/hummel", {
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

    const leagueAndClubRoutes: MetadataRoute.Sitemap = [];

    leagues.forEach((league) => {
      leagueAndClubRoutes.push(
        ...localizedEntries(`/jerseys/${league.id}`, {
          changeFrequency: "weekly",
          priority: 0.8,
        })
      );

      league.clubs.forEach((club) => {
        leagueAndClubRoutes.push(
          ...localizedEntries(`/jerseys/${league.id}/clubs/${club.id}`, {
            changeFrequency: "monthly",
            priority: 0.7,
          })
        );
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

    const jerseyRoutes: MetadataRoute.Sitemap = jerseys.flatMap((jersey) => {
      const path = `/jerseys/${jersey.club.league.id}/clubs/${jersey.club.id}/jerseys/${jersey.slug}`;
      return LOCALES.map((locale) => ({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: jersey.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
        images: jersey.imageUrl ? [jersey.imageUrl] : undefined,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [l, `${BASE_URL}/${l}${path}`])
          ),
        },
      }));
    });

    console.log(
      `Sitemap généré : ${jerseyRoutes.length / LOCALES.length} maillots × ${LOCALES.length} locales`
    );

    return [...staticRoutes, ...leagueAndClubRoutes, ...jerseyRoutes];
  } catch (error) {
    console.error("Erreur génération sitemap:", error);
    return [];
  }
}
