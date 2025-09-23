import { Package, Trophy, Shirt, Gift } from "lucide-react";
import { CONDITION_LABELS } from "@/types/collection";
import type { CollectionItemWithJersey } from "@/types/collection-page";

interface CollectionStatsProps {
  collectionItems: CollectionItemWithJersey[];
}

export function CollectionStats({ collectionItems }: CollectionStatsProps) {
  const totalJerseys = collectionItems.length;

  // Stats par ligue
  const leagueStats = collectionItems.reduce((acc, item) => {
    const leagueName = item.jersey.club.league.name;
    acc[leagueName] = (acc[leagueName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Stats par condition
  const conditionStats = collectionItems.reduce((acc, item) => {
    const condition = item.condition;
    acc[condition] = (acc[condition] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 🆕 Stats pour les nouveaux champs
  const giftCount = collectionItems.filter((item) => item.isGift).length;
  const mysteryBoxCount = collectionItems.filter(
    (item) => item.isFromMysteryBox
  ).length;
  const regularCount = collectionItems.filter(
    (item) => !item.isGift && !item.isFromMysteryBox
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Maillots totaux */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-medium text-muted-foreground">
            Maillots possédés
          </h3>
        </div>
        <p className="text-2xl font-bold">{totalJerseys}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {totalJerseys === 1
            ? "Maillot dans votre collection"
            : "Maillots dans votre collection"}
        </p>
      </div>

      {/* Ligues favorites */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-medium text-muted-foreground">
            Ligues favorites
          </h3>
        </div>
        <div className="space-y-2">
          {Object.entries(leagueStats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([league, count]) => (
              <div key={league} className="flex justify-between items-center">
                <span className="text-sm font-medium truncate">{league}</span>
                <span className="text-sm text-muted-foreground">{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* États/Conditions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <Shirt className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-medium text-muted-foreground">États</h3>
        </div>
        <div className="space-y-2">
          {Object.entries(conditionStats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([condition, count]) => (
              <div
                key={condition}
                className="flex justify-between items-center"
              >
                <span className="text-sm font-medium">
                  {CONDITION_LABELS[
                    condition as keyof typeof CONDITION_LABELS
                  ] || condition}
                </span>
                <span className="text-sm text-muted-foreground">{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* 🆕 Nouvelle stat : Provenance */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <Gift className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-medium text-muted-foreground">Provenance</h3>
        </div>
        <div className="space-y-2">
          {regularCount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Achetés</span>
              <span className="text-sm text-muted-foreground">
                {regularCount}
              </span>
            </div>
          )}
          {giftCount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-1">
                <Gift className="w-3 h-3 text-pink-500" />
                Cadeaux
              </span>
              <span className="text-sm text-muted-foreground">{giftCount}</span>
            </div>
          )}
          {mysteryBoxCount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-1">
                <Package className="w-3 h-3 text-purple-500" />
                Box mystère
              </span>
              <span className="text-sm text-muted-foreground">
                {mysteryBoxCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
