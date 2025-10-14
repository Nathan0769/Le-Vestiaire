"use client";

import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, LeaderboardCategory } from "@/types/leaderboard";
import { Package, Users, Globe, Clock } from "lucide-react";

interface CategorySelectorProps {
  value: LeaderboardCategory;
  onChange: (value: LeaderboardCategory) => void;
}

const getCategoryIcon = (category: LeaderboardCategory) => {
  switch (category) {
    case "collection_size":
      return <Package className="w-4 h-4" />;
    case "collection_diversity":
      return <Users className="w-4 h-4" />;
    case "league_diversity":
      return <Globe className="w-4 h-4" />;
    case "vintage_specialist":
      return <Clock className="w-4 h-4" />;
    default:
      return null;
  }
};

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const availableCategories: LeaderboardCategory[] = [
    "collection_size",
    "collection_diversity",
    "league_diversity",
    "vintage_specialist",
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Catégorie</h3>
      <div className="grid grid-cols-2 gap-3">
        {availableCategories.map((cat) => {
          const isActive = value === cat;
          return (
            <Badge
              key={cat}
              variant={isActive ? "default" : "outline"}
              className={`
                w-full h-auto py-3 px-4 text-sm cursor-pointer transition-all hover:shadow-md
                flex items-center justify-center text-center min-w-0
                ${isActive ? "shadow-md" : "hover:bg-primary/10"}
              `}
              onClick={() => onChange(cat)}
            >
              <span className="flex items-center gap-2 min-w-0">
                {getCategoryIcon(cat)}
                <span className="whitespace-normal break-words text-center leading-tight min-w-0">
                  {CATEGORY_LABELS[cat]}
                </span>
              </span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
