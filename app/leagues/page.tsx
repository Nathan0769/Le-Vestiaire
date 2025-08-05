"use client";

import { useEffect, useState } from "react";
import { League } from "@prisma/client";
import { LeagueGrid } from "@/components/leagues/leagues-grid";
import { SearchInput } from "@/components/ui/search-input";

export default function MaillotsPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchLeagues = async () => {
      const res = await fetch("/api/leagues");
      const data = await res.json();
      setLeagues(data);
    };

    fetchLeagues();
  }, []);

  const filteredLeagues = leagues.filter((league) =>
    league.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Choisis ta ligue</h1>
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Rechercher une ligue..."
      />
      <LeagueGrid leagues={filteredLeagues} />
    </div>
  );
}
