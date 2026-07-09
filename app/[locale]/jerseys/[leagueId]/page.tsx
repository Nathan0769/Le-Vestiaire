import prisma from "@/lib/prisma";
import { ClubList } from "@/components/jerseys/clubs/clubs-list";
import { ClubListByCountry } from "@/components/jerseys/clubs/clubs-list-by-country";
import { notFound } from "next/navigation";
import { LeagueBreadcrumb } from "@/components/jerseys/leagues/league-bread-crumb";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { getTranslations, getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { cache } from "react";

export const revalidate = 300;

const SUPPORTED_LOCALES = ["fr", "en", "es", "de", "pt", "nl", "it"];

function buildLeagueLanguageAlternates(leagueId: string) {
  const base = `https://le-vestiaire-foot.fr`;
  const path = `/jerseys/${leagueId}`;
  return SUPPORTED_LOCALES.reduce<Record<string, string>>((acc, l) => {
    acc[l] = l === "fr" ? `${base}${path}` : `${base}/${l}${path}`;
    return acc;
  }, {});
}

type Props = {
  params: Promise<{
    leagueId: string;
  }>;
};

const getCachedLeague = cache(async (leagueId: string) => {
  return prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      _count: { select: { clubs: true } },
      clubs: { orderBy: { name: "asc" } },
    },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { leagueId } = await params;
  const locale = await getLocale();
  const tMeta = await getTranslations("LeagueMetadata");

  const league = await getCachedLeague(leagueId);

  if (!league) {
    return {
      title: tMeta("notFoundTitle"),
    };
  }

  const title = tMeta("title", { leagueName: league.name });
  const description = tMeta("description", {
    leagueName: league.name,
    country: league.country,
    clubCount: league._count.clubs,
  });

  const canonicalPath = `/jerseys/${leagueId}`;
  const canonicalUrl =
    locale === "fr"
      ? `https://le-vestiaire-foot.fr${canonicalPath}`
      : `https://le-vestiaire-foot.fr/${locale}${canonicalPath}`;

  return {
    title,
    description,
    keywords: [
      `maillots ${league.name}`,
      `${league.name} collection`,
      `maillots foot ${league.country}`,
      `clubs ${league.name}`,
      `histoire maillots ${league.name}`,
    ].join(", "),
    openGraph: {
      title: tMeta("ogTitle", { leagueName: league.name }),
      description,
      images: [
        {
          url: league.logoUrl,
          width: 200,
          height: 200,
          alt: `Logo ${league.name}`,
        },
      ],
      type: "website",
    },
    alternates: {
      canonical: canonicalUrl,
      languages: buildLeagueLanguageAlternates(leagueId),
    },
  };
}

export default async function LeagueDetailPage({ params }: Props) {
  const { leagueId } = await params;

  const league = await getCachedLeague(leagueId);

  if (!league) return notFound();

  const tBreadcrumb = await getTranslations("BreadcrumbLabels");

  const isAutresBucket = league.country === "Autres";

  return (
    <div className="p-5 space-y-6">
      <BreadcrumbSchema
        items={[
          {
            name: tBreadcrumb("jerseys"),
            url: "https://le-vestiaire-foot.fr/jerseys",
          },
          {
            name: league.name,
            url: `https://le-vestiaire-foot.fr/jerseys/${leagueId}`,
          },
        ]}
      />
      <LeagueBreadcrumb leagueName={league.name} />
      {isAutresBucket ? (
        <AutresClubs leagueId={leagueId} />
      ) : (
        <ClubList clubs={league.clubs} leagueId={leagueId} />
      )}
    </div>
  );
}

async function AutresClubs({ leagueId }: { leagueId: string }) {
  const clubs = await prisma.club.findMany({
    where: { leagueId },
    orderBy: { name: "asc" },
    include: {
      seasonLeagues: {
        where: { league: { country: { not: "Autres" } } },
        include: { league: { select: { country: true } } },
        orderBy: { season: "desc" },
        take: 1,
      },
    },
  });

  const enriched = clubs.map((c) => ({
    club: c,
    originCountry: c.seasonLeagues[0]?.league.country ?? null,
  }));

  return <ClubListByCountry entries={enriched} leagueId={leagueId} />;
}
