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

type Props = {
  params: {
    leagueId: string;
    clubId: string;
  };
};

export default async function ClubDetailPage(props: Props) {
  const { params } = props;
  const club = await prisma.club.findUnique({
    where: { id: params.clubId },
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
        },
      },
    },
  });

  if (!club) {
    return <div className="p-6">Club introuvable.</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/jerseys">Toutes les ligues</Link>
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
            alt={club.name}
            fill
            className="object-contain"
          />
        </div>
        <h1 className="text-2xl font-semibold">{club.name}</h1>
      </div>

      <JerseysBySeason
        jerseys={club.jerseys}
        primaryColor={club.primaryColor}
      />
    </div>
  );
}
