import { LeagueCard } from "../leagues/leagues-card";
import { League } from "../../../types/league";

type Props = {
  leagues: League[];
};

export function LeagueGrid({ leagues }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {leagues.map((league) => (
        <LeagueCard key={league.id} league={league} />
      ))}
    </div>
  );
}
