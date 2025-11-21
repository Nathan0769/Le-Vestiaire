"use client";

import { useEffect, useState } from "react";
import { League } from "@prisma/client";
import { LeagueGrid } from "@/components/jerseys/leagues/leagues-grid";
import { SearchInput } from "@/components/ui/search-input";
import { useTranslations } from "next-intl";
import { useSearchClubs } from "@/hooks/useSearchClubs";
import { ClubCard } from "@/components/jerseys/clubs/clubs-card";
import { Loader2 } from "lucide-react";

export default function MaillotsPage() {
  const t = useTranslations("Jerseys");
  const [leagues, setLeagues] = useState<League[]>([]);
  const [search, setSearch] = useState("");
  const { clubs, isLoading: isSearchingClubs } = useSearchClubs(search);

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

  const hasSearch = search.length >= 2;

  return (
    <div className="p-5 space-y-6">
      <h1 className="text-2xl font-semibold">{t("selectLeague")}</h1>
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t("searchLeagueOrClub")}
      />

      {filteredLeagues.length > 0 && (
        <div className="space-y-3">
          {hasSearch && (
            <h2 className="text-lg font-medium text-muted-foreground">
              {t("leagues")}
            </h2>
          )}
          <LeagueGrid leagues={filteredLeagues} />
        </div>
      )}

      {hasSearch && (isSearchingClubs || clubs.length > 0) && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-muted-foreground">
            {t("clubs")}
          </h2>
          {isSearchingClubs ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("searching")}</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {clubs.map((club) => (
                <ClubCard
                  key={club.id}
                  club={{
                    id: club.id,
                    name: club.name,
                    shortName: club.shortName ?? "",
                    logoUrl: club.logoUrl ?? "",
                    primaryColor: "",
                    leagueId: club.league.id,
                  }}
                  leagueId={club.league.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
