import { Club } from "@prisma/client";
import { ClubCard } from "./clubs-card";

type Props = {
  clubs: Club[];
  leagueId: string;
};

export function ClubGrid({ clubs, leagueId }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {clubs.map((club) => (
        <ClubCard key={club.id} club={club} leagueId={leagueId} />
      ))}
    </div>
  );
}
