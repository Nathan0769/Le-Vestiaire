import { ClubDetailClient } from "@/components/jerseys/clubs/club-detail-client";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { ClubSchema } from "@/components/seo/club-schema";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import prisma from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { cache } from "react";
import { computeClubStats } from "@/lib/club-stats";

const SUPPORTED_LOCALES = ["fr", "en", "es", "de", "pt", "nl", "it"];

function buildClubLanguageAlternates(leagueId: string, clubId: string) {
  const base = `https://le-vestiaire-foot.fr`;
  const path = `/jerseys/${leagueId}/clubs/${clubId}`;
  return SUPPORTED_LOCALES.reduce<Record<string, string>>((acc, l) => {
    acc[l] = l === "fr" ? `${base}${path}` : `${base}/${l}${path}`;
    return acc;
  }, {});
}

export const revalidate = 3600;

type Props = {
  params: Promise<{
    leagueId: string;
    clubId: string;
  }>;
};

const getCachedClub = cache(async (clubId: string) => {
  return prisma.club.findUnique({
    where: { id: clubId },
    include: {
      league: true,
      jerseys: {
        orderBy: { season: "desc" },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          type: true,
          variant: true,
          season: true,
          brand: true,
          clubId: true,
          description: true,
          slug: true,
        },
      },
    },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clubId } = await params;
  const locale = await getLocale();
  const tMeta = await getTranslations("ClubMetadata");

  const club = await getCachedClub(clubId);

  if (!club) {
    return {
      title: tMeta("notFoundTitle"),
    };
  }

  const latestSeason = club.jerseys[0]?.season || "";
  const title = tMeta("title", {
    clubName: club.name,
    leagueName: club.league.name,
  });
  const description = latestSeason
    ? tMeta("description", {
        clubName: club.name,
        leagueName: club.league.name,
        latestSeason,
      })
    : tMeta("descriptionWithoutSeason", {
        clubName: club.name,
        leagueName: club.league.name,
      });

  const canonicalPath = `/jerseys/${club.league.id}/clubs/${clubId}`;
  const canonicalUrl =
    locale === "fr"
      ? `https://le-vestiaire-foot.fr${canonicalPath}`
      : `https://le-vestiaire-foot.fr/${locale}${canonicalPath}`;

  return {
    title,
    description,
    keywords: [
      `maillots ${club.name}`,
      `${club.name} collection`,
      `maillots ${club.league.name}`,
      `histoire maillots ${club.name}`,
      `tous les maillots ${club.name}`,
      `collection ${club.name}`,
    ].join(", "),
    openGraph: {
      title: tMeta("ogTitle", { clubName: club.name }),
      description,
      images: [
        {
          url: club.logoUrl,
          width: 200,
          height: 200,
          alt: `Logo ${club.name}`,
        },
      ],
      type: "website",
    },
    alternates: {
      canonical: canonicalUrl,
      languages: buildClubLanguageAlternates(club.league.id, clubId),
    },
  };
}

export default async function ClubDetailPage(props: Props) {
  const { clubId } = await props.params;

  const club = await getCachedClub(clubId);

  const t = await getTranslations("Jerseys");

  if (!club) {
    return <div className="p-6">{t("clubNotFoundText")}</div>;
  }

  const [ratingAggregate, favoriteCount] = await Promise.all([
    prisma.rating.aggregate({
      where: { jersey: { clubId } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.user.count({ where: { favoriteClubId: clubId } }),
  ]);

  const stats = computeClubStats(
    club.jerseys,
    {
      avg: ratingAggregate._avg.rating ? Number(ratingAggregate._avg.rating) : 0,
      count: ratingAggregate._count.rating,
    },
    favoriteCount
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <BreadcrumbSchema
        items={[
          { name: "Maillots", url: "https://le-vestiaire-foot.fr/jerseys" },
          {
            name: club.league.name,
            url: `https://le-vestiaire-foot.fr/jerseys/${club.league.id}`,
          },
          {
            name: club.name,
            url: `https://le-vestiaire-foot.fr/jerseys/${club.league.id}/clubs/${club.id}`,
          },
        ]}
      />
      <ClubSchema
        club={club}
        url={`https://le-vestiaire-foot.fr/jerseys/${club.league.id}/clubs/${club.id}`}
        totalJerseys={stats.totalJerseys}
        averageRating={stats.avgRating}
        totalRatings={stats.totalRatings}
        favoriteCount={stats.favoriteCount}
      />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/jerseys">{t("allLeagues")}</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link href={`/jerseys/${club.league.id}`}>{club.league.name}</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{club.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <ClubDetailClient
        jerseys={club.jerseys}
        primaryColor={club.primaryColor}
        club={club}
        stats={stats}
      />
    </div>
  );
}
