import { JerseysBySeason } from "@/components/jerseys/jerseys/jerseys-by-season";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{
    leagueId: string;
    clubId: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clubId } = await params;

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      league: true,
      jerseys: {
        select: { season: true },
        orderBy: { season: "desc" },
        take: 1,
      },
    },
  });

  if (!club) {
    return {
      title: "Club introuvable - Le Vestiaire",
    };
  }

  const latestSeason = club.jerseys[0]?.season || "";
  const title = `Maillots ${club.name} - Toutes les saisons | Le Vestiaire`;
  const description = `Collection complète des maillots du ${club.name} (${
    club.league.name
  }). Découvrez tous les maillots domicile, extérieur et third ${
    latestSeason ? `depuis ${latestSeason.split("-")[0]}` : "du club"
  }. Ajoutez-les à votre collection !`;

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

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      league: true,
      jerseys: {
        orderBy: {
          season: "desc",
        },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          type: true,
          season: true,
          brand: true,
          clubId: true,
          description: true,
          slug: true,
        },
      },
    },
  });

  const t = await getTranslations("Jerseys");

  if (!club) {
    return <div className="p-6">{t("clubNotFoundText")}</div>;
  }

  return (
    <div className="p-6 space-y-8">
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

      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12 sm:w-16 sm:h-16">
          <Image
            src={club.logoUrl}
            alt={`Logo ${club.name}`}
            fill
            className="object-contain"
          />
        </div>
        <h1 className="text-2xl font-semibold">{club.name}</h1>
      </div>

      <JerseysBySeason
        jerseys={club.jerseys}
        primaryColor={club.primaryColor}
        club={club}
      />
    </div>
  );
}
