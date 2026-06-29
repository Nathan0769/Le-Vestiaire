import prisma from "@/lib/prisma";
import { ClubList } from "@/components/jerseys/clubs/clubs-list";
import { notFound } from "next/navigation";
import { LeagueBreadcrumb } from "@/components/jerseys/leagues/league-bread-crumb";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import type { Metadata } from "next";
import { cache } from "react";

export const revalidate = 300;

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

  const league = await getCachedLeague(leagueId);

  if (!league) {
    return {
      title: "Ligue introuvable - Le Vestiaire",
    };
  }

  const title = `Maillots ${league.name} - Tous les clubs | Le Vestiaire`;
  const description = `Collection complète des maillots de ${league.name} (${league.country}). Découvrez les ${league._count.clubs} clubs et leurs maillots historiques. La plus grande base de données de maillots ${league.name}.`;

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
      title: `Tous les maillots ${league.name}`,
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
      canonical: `https://le-vestiaire-foot.fr/jerseys/${leagueId}`,
    },
  };
}

export default async function LeagueDetailPage({ params }: Props) {
  const { leagueId } = await params;

  const league = await getCachedLeague(leagueId);

  if (!league) return notFound();

  return (
    <div className="p-5 space-y-6">
      <BreadcrumbSchema
        items={[
          { name: "Maillots", url: "https://le-vestiaire-foot.fr/jerseys" },
          {
            name: league.name,
            url: `https://le-vestiaire-foot.fr/jerseys/${leagueId}`,
          },
        ]}
      />
      <LeagueBreadcrumb leagueName={league.name} />
      <ClubList clubs={league.clubs} leagueId={leagueId} />
    </div>
  );
}
