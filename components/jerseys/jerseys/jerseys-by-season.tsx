import { SimpleJersey, ClubWithLeague } from "@/types/jersey";
import { JERSEY_TYPE_ORDER } from "@/lib/jersey-utils";
import { JerseyCard } from "./jersey-card";

type Props = {
  jerseys: (SimpleJersey & { slug?: string | null })[];
  primaryColor: string;
  club: ClubWithLeague;
  isAdmin?: boolean;
};

export function JerseysBySeason({ jerseys, primaryColor, club, isAdmin }: Props) {
  const grouped = jerseys.reduce<Record<string, SimpleJersey[]>>(
    (acc, jersey) => {
      if (!acc[jersey.season]) acc[jersey.season] = [];
      acc[jersey.season].push(jersey);
      return acc;
    },
    {}
  );

  const sortedSeasons = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-10">
      {sortedSeasons.map((season) => {
        const seasonJerseys = grouped[season];

        const sortedJerseys = seasonJerseys.sort((a, b) => {
          const typeDiff =
            (JERSEY_TYPE_ORDER[a.type] ?? 99) - (JERSEY_TYPE_ORDER[b.type] ?? 99);
          if (typeDiff !== 0) return typeDiff;
          return (a.variant ?? 1) - (b.variant ?? 1);
        });

        return (
          <div key={season}>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{season}</h2>
              <div
                className="h-1 w-1/4 rounded-full mt-1"
                style={{ backgroundColor: primaryColor }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {sortedJerseys.map((jersey) => (
                <JerseyCard
                  key={jersey.id}
                  jersey={jersey}
                  leagueId={club.league.id}
                  club={club}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
