import prisma from "@/lib/prisma";
import { ClubLeaguesManagement } from "@/components/admin/club-leagues/club-leagues-management";

export const metadata = {
  title: "Ligues par saison - Admin",
  description: "Associer un club à une ligue pour une saison donnée",
};

export default async function AdminClubLeaguesPage() {
  const leagues = await prisma.league.findMany({
    select: { id: true, name: true, country: true },
    orderBy: [{ country: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Ligues par saison</h2>
        <p className="text-muted-foreground">
          Associer un club à une ligue pour une saison donnée. Les saisons sans
          entrée utilisent la ligue actuelle du club par défaut.
        </p>
      </div>

      <ClubLeaguesManagement leagues={leagues} />
    </div>
  );
}
