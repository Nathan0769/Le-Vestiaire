import { SimpleJersey, JerseyType, ClubWithLeague } from "@/types/jersey";
import { JerseyCard } from "./jersey-card";

type Props = {
  jerseys: (SimpleJersey & { slug?: string | null })[];
  primaryColor: string;
  club: ClubWithLeague;
};

const typeOrder: Record<JerseyType, number> = {
  HOME: 1,
  AWAY: 2,
  THIRD: 3,
  FOURTH: 4,
  SPECIAL: 5,
  GOALKEEPER: 6,
};

export function JerseysBySeason({ jerseys, primaryColor, club }: Props) {
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

        const sortedJerseys = seasonJerseys.sort(
          (a, b) => typeOrder[a.type] - typeOrder[b.type]
        );

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
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
