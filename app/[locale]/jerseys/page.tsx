"use client";

import { useEffect, useState } from "react";
import { League } from "@prisma/client";
import { LeagueGrid } from "@/components/jerseys/leagues/leagues-grid";
import { SearchInput } from "@/components/ui/search-input";
import { useTranslations } from "next-intl";

export default function MaillotsPage() {
  const t = useTranslations("Jerseys");
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
    <div className="p-5 space-y-6">
      <h1 className="text-2xl font-semibold">{t("selectLeague")}</h1>
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t("searchLeague")}
      />
      <LeagueGrid leagues={filteredLeagues} />
    </div>
  );
}
