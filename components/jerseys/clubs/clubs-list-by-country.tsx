"use client";

import { Club } from "@prisma/client";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ClubGrid } from "./clubs-grid";
import { useTranslations } from "next-intl";

type Entry = { club: Club; originCountry: string | null };

type Props = {
  entries: Entry[];
  leagueId: string;
};

const UNKNOWN_LABEL = "Sans pays d'origine";

export function ClubListByCountry({ entries, leagueId }: Props) {
  const t = useTranslations("Jerseys");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter((e) => e.club.name.toLowerCase().includes(q));
  }, [entries, search]);

  const groups = useMemo(() => {
    const map = new Map<string, Club[]>();
    for (const e of filtered) {
      const key = e.originCountry ?? UNKNOWN_LABEL;
      const list = map.get(key) ?? [];
      list.push(e.club);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === UNKNOWN_LABEL) return 1;
      if (b === UNKNOWN_LABEL) return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  return (
    <div className="space-y-6">
      <Input
        placeholder={t("searchClub")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {groups.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun club.</p>
      )}
      {groups.map(([country, clubs]) => (
        <section key={country} className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">
            {country}
            <span className="ml-2 text-xs font-normal">({clubs.length})</span>
          </h2>
          <ClubGrid clubs={clubs} leagueId={leagueId} />
        </section>
      ))}
    </div>
  );
}
