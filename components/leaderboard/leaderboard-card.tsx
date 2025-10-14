"use client";

import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Heart } from "lucide-react";
import type { LeaderboardEntry } from "@/types/leaderboard";

interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  category: string;
  isCurrentUser?: boolean;
}

export function LeaderboardCard({
  entry,
  category,
  isCurrentUser = false,
}: LeaderboardCardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-500/20 text-yellow-700 border-yellow-300";
      case 2:
        return "bg-gray-400/20 text-gray-700 border-gray-300";
      case 3:
        return "bg-amber-600/20 text-amber-700 border-amber-300";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getPodiumBorderClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "ring-2 ring-yellow-500 shadow-lg shadow-yellow-500/20";
      case 2:
        return "ring-2 ring-gray-400 shadow-lg shadow-gray-400/20";
      case 3:
        return "ring-2 ring-amber-600 shadow-lg shadow-amber-600/20";
      default:
        return "";
    }
  };

  const getScoreColorClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-600 dark:text-yellow-500";
      case 2:
        return "text-gray-600 dark:text-gray-400";
      case 3:
        return "text-amber-600 dark:text-amber-500";
      default:
        return "text-primary";
    }
  };

  const getScoreLabel = () => {
    switch (category) {
      case "collection_size":
        return `${entry.score} maillot${entry.score > 1 ? "s" : ""}`;
      case "collection_diversity":
        return `${entry.score} club${entry.score > 1 ? "s" : ""}`;
      case "league_diversity":
        return `${entry.score} ligue${entry.score > 1 ? "s" : ""}`;
      case "vintage_specialist":
        return `${entry.score} vintage`;
      default:
        return entry.score;
    }
  };

  return (
    <Card
      className={`hover:shadow-md transition-all overflow-hidden ${
        isCurrentUser ? "ring-2 ring-primary" : ""
      } ${getPodiumBorderClass(entry.rank)}`}
    >
      <CardContent className="py-1 px-1.5 sm:py-0.5 sm:px-3">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="flex flex-col items-center gap-1 w-[50px] sm:w-[60px] flex-shrink-0">
            {entry.rank <= 3 ? (
              <>
                {getRankIcon(entry.rank)}
                <Badge
                  variant="outline"
                  className={`${getRankBadgeColor(
                    entry.rank
                  )} text-[10px] sm:text-xs px-1.5 sm:px-2`}
                >
                  #{entry.rank}
                </Badge>
              </>
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-muted-foreground">
                #{entry.rank}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <UserAvatar
              src={entry.avatarUrl || undefined}
              name={entry.name}
              size="sm"
              className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0"
            />
            <div
              className={`flex-1 min-w-0 h-[44px] flex flex-col ${
                entry.favoriteClub ? "justify-center" : "justify-center"
              }`}
            >
              <div className="flex items-center gap-1.5 leading-tight">
                <p className="font-semibold text-sm sm:text-base truncate">
                  {entry.username}
                </p>
                {isCurrentUser && (
                  <span className="text-[10px] sm:text-xs text-primary flex-shrink-0 font-medium">
                    (Vous)
                  </span>
                )}
              </div>

              {entry.favoriteClub && (
                <div className="flex items-center gap-1 h-[18px]">
                  <Heart className="w-3 h-3 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground truncate">
                    {entry.favoriteClub.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end flex-shrink-0">
            <div
              className={`text-sm sm:text-lg font-bold whitespace-nowrap ${getScoreColorClass(
                entry.rank
              )}`}
            >
              {getScoreLabel()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
