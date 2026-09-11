"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface ClubRanking {
  clubId: string;
  clubName: string;
  clubLogoUrl: string | null;
  userCount: number;
  rank: number;
  totalCollectors: number;
}

function ordinal(n: number): string {
  return n === 1 ? "1er" : `${n}e`;
}

/**
 * Classements de l'utilisateur par club (rang parmi les collectionneurs du club).
 * N'affiche que les clubs qualifiés (>= 5 maillots différents, >= 5 collectionneurs) ;
 * masqué si aucun.
 */
export function ClubRankingsCard({ data }: { data: ClubRanking[] }) {
  if (!data || data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Tes classements par club
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((r) => (
          <div
            key={r.clubId}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            {r.clubLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.clubLogoUrl}
                alt={r.clubName}
                className="h-10 w-10 shrink-0 object-contain"
              />
            ) : (
              <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{r.clubName}</p>
              <p className="text-sm text-muted-foreground">
                {r.userCount} maillots différents · sur {r.totalCollectors}{" "}
                collectionneurs
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-bold text-primary">{ordinal(r.rank)}</p>
              <p className="text-xs text-muted-foreground">collectionneur</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
