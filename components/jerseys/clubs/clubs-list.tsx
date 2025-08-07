"use client";

import { Club } from "@prisma/client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ClubGrid } from "./clubs-grid";

type Props = {
  clubs: Club[];
  leagueId: string;
};

export function ClubList({ clubs, leagueId }: Props) {
  const [search, setSearch] = useState("");

  const filtered = clubs.filter((club) =>
    club.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Rechercher un club..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <ClubGrid clubs={filtered} leagueId={leagueId} />
    </div>
  );
}
