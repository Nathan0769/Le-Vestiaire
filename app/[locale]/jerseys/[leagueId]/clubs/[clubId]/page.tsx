import { ClubDetailClient } from "@/components/jerseys/clubs/club-detail-client";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
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
import { getTranslations } from "next-intl/server";
import { cache } from "react";
import { computeClubStats } from "@/lib/club-stats";

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

  const club = await getCachedClub(clubId);

  if (!club) {
    return {
      title: "Club introuvable - Le Vestiaire",
    };
  }

  const latestSeason = club.jerseys[0]?.season || "";
  const title = `Maillot ${club.name} (${club.league.name}) - Toutes saisons | Le Vestiaire`;
  const description = `Tous les maillots du ${club.name} (${club.league.name}) : domicile, extérieur, gardien${
    latestSeason ? `, saison ${latestSeason}` : ""
  }. Fiches détaillées, notes de la communauté, ajout à votre collection ou wishlist.`;

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
      title: `Tous les maillots ${club.name}`,
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
      canonical: `https://le-vestiaire-foot.fr/jerseys/${club.league.id}/clubs/${clubId}`,
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
