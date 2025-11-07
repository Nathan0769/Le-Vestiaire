"use client";

import { Club } from "@prisma/client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ClubGrid } from "./clubs-grid";
import { useTranslations } from "next-intl";

type Props = {
  clubs: Club[];
  leagueId: string;
};

export function ClubList({ clubs, leagueId }: Props) {
  const t = useTranslations("Jerseys");
  const [search, setSearch] = useState("");

  const filtered = clubs.filter((club) =>
    club.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder={t("searchClub")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <ClubGrid clubs={filtered} leagueId={leagueId} />
    </div>
  );
}
