"use client";

import { useState, useCallback, useEffect } from "react";
import { ClubHero } from "./club-hero";
import { BrandTimeline } from "./brand-timeline";
import { JerseysBySeason } from "@/components/jerseys/jerseys/jerseys-by-season";
import { SimpleJersey, ClubWithLeague } from "@/types/jersey";
import type { ClubStats } from "@/lib/club-stats";

type Props = {
  jerseys: (SimpleJersey & { slug?: string | null })[];
  primaryColor: string;
  club: ClubWithLeague;
  stats: ClubStats;
};

export function ClubDetailClient({ jerseys, primaryColor, club, stats }: Props) {
  const [deleteMode, setDeleteMode] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/is-admin")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.isSuperAdmin) setIsSuperAdmin(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNameClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isSuperAdmin) return;
      if (e.shiftKey) {
        e.preventDefault();
        setDeleteMode((prev) => !prev);
      }
    },
    [isSuperAdmin]
  );

  return (
    <div className="space-y-6">
      <ClubHero
        club={club}
        stats={stats}
        isSuperAdmin={isSuperAdmin}
        deleteMode={deleteMode}
        onNameClick={handleNameClick}
      />

      <BrandTimeline
        timeline={stats.brandTimeline}
        primaryColor={primaryColor}
      />

      <JerseysBySeason
        jerseys={jerseys}
        primaryColor={primaryColor}
        club={club}
        isAdmin={deleteMode}
      />
    </div>
  );
}
