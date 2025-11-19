"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User } from "lucide-react";
import {
  IconBallFootball,
  IconShirtSport,
  IconUsers,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Player {
  id: string;
  name: string;
  number: number | null;
  position: "GOALKEEPER" | "DEFENDER" | "MIDFIELDER" | "FORWARD" | null;
  photoUrl: string | null;
  goals: number | null;
  assists: number | null;
  matches: number | null;
  cleanSheets: number | null;
  goalsConceded: number | null;
}

interface PlayersDisplayProps {
  jerseyId: string;
  clubId: string;
  season: string;
}

export function PlayersDisplay({ jerseyId }: PlayersDisplayProps) {
  const t = useTranslations("JerseyDetail.players");
  const tPosition = useTranslations("PlayerPosition");
  const tPositionPlural = useTranslations("PlayerPositionPlural");
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch(`/api/jerseys/${jerseyId}/players`);

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des joueurs");
        }

        const data = await response.json();
        setPlayers(data);
      } catch (err) {
        console.error("Error fetching players:", err);
        setError(t("errorLoading"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayers();
  }, [jerseyId, t]);

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

  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <IconUsers
          className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4"
          stroke={1.5}
        />
        <p className="text-muted-foreground">{t("noPlayers")}</p>
      </div>
    );
  }

  const playersByPosition = {
    GOALKEEPER: players.filter((p) => p.position === "GOALKEEPER"),
    DEFENDER: players.filter((p) => p.position === "DEFENDER"),
    MIDFIELDER: players.filter((p) => p.position === "MIDFIELDER"),
    FORWARD: players.filter((p) => p.position === "FORWARD"),
    UNKNOWN: players.filter((p) => !p.position),
  };

  const renderPlayerCard = (player: Player) => (
    <Card key={player.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex-shrink-0">
            {player.photoUrl ? (
              <Image
                src={player.photoUrl}
                alt={player.name}
                width={80}
                height={80}
                className="rounded-lg object-cover"
                unoptimized
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg break-words leading-tight">
                  {player.name}
                </h3>
                {player.position && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {tPosition(player.position)}
                  </Badge>
                )}
              </div>
              {player.number && (
                <div className="flex-shrink-0 text-3xl font-bold text-primary leading-none">
                  {player.number}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 pt-3 border-t border-border text-sm text-muted-foreground justify-center items-center sm:items-start">
          <div className="flex items-center gap-1">
            <IconShirtSport className="w-4 h-4" stroke={1.5} />
            <span>
              {player.matches ?? 0} {t("matches")}
            </span>
          </div>
          {player.position === "GOALKEEPER" ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <IconShieldCheck className="w-4 h-4 text-green-600" stroke={1.5} />
                    <span>
                      {player.cleanSheets ?? 0} {t("cleanSheets")}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("cleanSheetsFull")}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <IconBallFootball className="w-4 h-4 text-amber-500" stroke={1.5} />
                    <span>
                      {player.goalsConceded ?? 0} {t("goalsConceded")}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("goalsConcededFull")}</p>
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <IconBallFootball className="w-4 h-4 text-blue-700" stroke={1.5} />
                <span>
                  {player.goals ?? 0} {t("goals")}
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <IconBallFootball className="w-4 h-4 text-green-600" stroke={1.5} />
                    <span>
                      {player.assists ?? 0} {t("assists")}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("assistsFull")}</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderPositionSection = (
    position: keyof typeof playersByPosition,
    positionPlayers: Player[]
  ) => {
    if (positionPlayers.length === 0) return null;

    let positionLabel = "";
    if (position !== "UNKNOWN") {
      positionLabel =
        positionPlayers.length > 1
          ? tPositionPlural(position)
          : tPosition(position);
    }

    return (
      <div key={position} className="space-y-4">
        {position !== "UNKNOWN" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{positionLabel}</h3>
              <Badge variant="outline" className="text-xs">
                {positionPlayers.length}
              </Badge>
            </div>
            <div className="h-0.5 w-16 bg-primary rounded-full"></div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {positionPlayers.map(renderPlayerCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderPositionSection("FORWARD", playersByPosition.FORWARD)}
      {renderPositionSection("MIDFIELDER", playersByPosition.MIDFIELDER)}
      {renderPositionSection("DEFENDER", playersByPosition.DEFENDER)}
      {renderPositionSection("GOALKEEPER", playersByPosition.GOALKEEPER)}
      {renderPositionSection("UNKNOWN", playersByPosition.UNKNOWN)}
    </div>
  );
}
