"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Trophy, Loader2, Medal } from "lucide-react";
import { useTranslations } from "next-intl";

interface ClubTrophy {
  id: string;
  competition: string;
  country: string;
  season: string;
  place: string;
}

interface PalmaresDisplayProps {
  clubId: string;
  season: string;
}

export function PalmaresDisplay({ clubId, season }: PalmaresDisplayProps) {
  const t = useTranslations("JerseyDetail.palmares");
  const [trophies, setTrophies] = useState<ClubTrophy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrophies = async () => {
      try {
        const res = await fetch(
          `/api/clubs/${clubId}/trophies?season=${encodeURIComponent(season)}`
        );

        if (!res.ok) throw new Error();

        const data = await res.json();
        setTrophies(data.trophies);
      } catch {
        setError(t("errorLoading"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrophies();
  }, [clubId, season, t]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (trophies.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" strokeWidth={1.5} />
        <p className="text-muted-foreground">{t("noTrophies")}</p>
      </div>
    );
  }

  const winners = trophies.filter((t) => t.place === "Winner");
  const finalists = trophies.filter((t) => t.place === "Finalist");

  return (
    <div className="space-y-6">
      {winners.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" strokeWidth={1.5} />
            <h4 className="font-semibold text-base">{t("winner")}</h4>
            <Badge variant="outline" className="text-xs">{winners.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {winners.map((trophy) => (
              <TrophyCard key={trophy.id} trophy={trophy} variant="winner" />
            ))}
          </div>
        </div>
      )}

      {finalists.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
            <h4 className="font-semibold text-base">{t("finalist")}</h4>
            <Badge variant="outline" className="text-xs">{finalists.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {finalists.map((trophy) => (
              <TrophyCard key={trophy.id} trophy={trophy} variant="finalist" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TrophyCard({
  trophy,
  variant,
}: {
  trophy: ClubTrophy;
  variant: "winner" | "finalist";
}) {
  return (
    <div
      className={`rounded-lg border p-4 flex items-center gap-3 ${
        variant === "winner"
          ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900/40 dark:bg-yellow-950/20"
          : "border-slate-200 bg-slate-50 dark:border-slate-700/40 dark:bg-slate-900/20"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          variant === "winner"
            ? "bg-yellow-100 dark:bg-yellow-900/40"
            : "bg-slate-100 dark:bg-slate-800/40"
        }`}
      >
        {variant === "winner" ? (
          <Trophy className="w-5 h-5 text-yellow-500" strokeWidth={1.5} />
        ) : (
          <Medal className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
        )}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-sm leading-tight truncate">{trophy.competition}</p>
        <p className="text-xs text-muted-foreground">{trophy.country}</p>
      </div>
    </div>
  );
}
