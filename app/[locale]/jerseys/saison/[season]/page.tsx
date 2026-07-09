import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getTranslations, getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { SeasonHubView } from "@/components/jerseys/season/season-hub-view";

export const revalidate = 3600;

const SUPPORTED_LOCALES = ["fr", "en", "es", "de", "pt", "nl", "it"];

const SEASON_URL_PATTERN = /^\d{4}(-\d{4})?$/;

function buildSeasonLanguageAlternates(season: string) {
  const base = `https://le-vestiaire-foot.fr`;
  const path = `/jerseys/saison/${season}`;
  return SUPPORTED_LOCALES.reduce<Record<string, string>>((acc, l) => {
    acc[l] = l === "fr" ? `${base}${path}` : `${base}/${l}${path}`;
    return acc;
  }, {});
}

type Props = {
  params: Promise<{
    season: string;
  }>;
};

const getCachedSeasonData = cache(async (season: string) => {
  if (!SEASON_URL_PATTERN.test(season)) return null;

  const jerseys = await prisma.jersey.findMany({
    where: { season },
    orderBy: [{ clubId: "asc" }, { type: "asc" }],
    select: {
      id: true,
      name: true,
      imageUrl: true,
      type: true,
      slug: true,
      season: true,
      variant: true,
      club: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logoUrl: true,
          primaryColor: true,
          leagueId: true,
          league: {
            select: { id: true, name: true, tier: true },
          },
        },
      },
    },
  });

  if (jerseys.length === 0) return null;

  const clubIds = new Set(jerseys.map((j) => j.club.id));
  const leagueIds = new Set(jerseys.map((j) => j.club.league.id));

  const leaguesById = new Map<
    string,
    { id: string; name: string; tier: number; jerseys: typeof jerseys }
  >();
  for (const jersey of jerseys) {
    const league = jersey.club.league;
    const existing = leaguesById.get(league.id) ?? {
      id: league.id,
      name: league.name,
      tier: league.tier,
      jerseys: [],
    };
    existing.jerseys.push(jersey);
    leaguesById.set(league.id, existing);
  }

  const jerseysByLeague = [...leaguesById.values()]
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return a.name.localeCompare(b.name);
    })
    .map(({ id, name, jerseys }) => ({
      league: { id, name },
      jerseys: jerseys.map(({ club, ...rest }) => ({
        ...rest,
        club: {
          id: club.id,
          name: club.name,
          shortName: club.shortName,
          logoUrl: club.logoUrl,
          primaryColor: club.primaryColor,
          leagueId: club.leagueId,
        },
      })),
    }));

  return {
    jerseyCount: jerseys.length,
    clubCount: clubIds.size,
    leagueCount: leagueIds.size,
    jerseysByLeague,
  };
});

export async function generateStaticParams() {
  const seasons = await prisma.jersey.findMany({
    distinct: ["season"],
    select: { season: true },
  });
  return seasons
    .filter((s) => SEASON_URL_PATTERN.test(s.season))
    .map((s) => ({ season: s.season }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season } = await params;
  const locale = await getLocale();
  const tMeta = await getTranslations("SeasonPageMetadata");

  const data = await getCachedSeasonData(season);

  if (!data) {
    return {
      title: tMeta("notFoundTitle"),
    };
  }

  const title = tMeta("title", { season });
  const description = tMeta("description", {
    season,
    jerseyCount: data.jerseyCount,
    clubCount: data.clubCount,
    leagueCount: data.leagueCount,
  });

  const canonicalPath = `/jerseys/saison/${season}`;
  const canonicalUrl =
    locale === "fr"
      ? `https://le-vestiaire-foot.fr${canonicalPath}`
      : `https://le-vestiaire-foot.fr/${locale}${canonicalPath}`;

  return {
    title,
    description,
    openGraph: {
      title: tMeta("ogTitle", { season }),
      description,
      url: canonicalUrl,
      siteName: "Le Vestiaire Foot",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: tMeta("ogTitle", { season }),
      description,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: buildSeasonLanguageAlternates(season),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function SeasonPage({ params }: Props) {
  const { season } = await params;

  const data = await getCachedSeasonData(season);

  if (!data) return notFound();

  const tBreadcrumb = await getTranslations("BreadcrumbLabels");

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: tBreadcrumb("jerseys"),
            url: "https://le-vestiaire-foot.fr/jerseys",
          },
          {
            name: tBreadcrumb("season"),
            url: "https://le-vestiaire-foot.fr/jerseys",
          },
          {
            name: season,
            url: `https://le-vestiaire-foot.fr/jerseys/saison/${season}`,
          },
        ]}
      />
      <SeasonHubView
        season={season}
        jerseyCount={data.jerseyCount}
        clubCount={data.clubCount}
        leagueCount={data.leagueCount}
        jerseysByLeague={data.jerseysByLeague}
      />
    </>
  );
}
