import prisma from "@/lib/prisma";
import { ClubList } from "@/components/jerseys/clubs/clubs-list";
import { notFound } from "next/navigation";
import { LeagueBreadcrumb } from "@/components/jerseys/leagues/league-bread-crumb";

type Props = {
  params: {
    leagueId: string;
  };
};

export default async function LeagueDetailPage({
  params: { leagueId },
}: Props) {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      clubs: {
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!league) return notFound();

  return (
    <div className="p-5 space-y-6">
      <LeagueBreadcrumb leagueName={league.name} />
      <ClubList clubs={league.clubs} leagueId={leagueId} />
    </div>
  );
}
