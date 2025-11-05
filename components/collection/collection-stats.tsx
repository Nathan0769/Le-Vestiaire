import { Package, Trophy, Shirt, Gift } from "lucide-react";
import type { CollectionItemWithJersey } from "@/types/collection-page";
import { useTranslations } from "next-intl";

interface CollectionStatsProps {
  collectionItems: CollectionItemWithJersey[];
}

export function CollectionStats({ collectionItems }: CollectionStatsProps) {
  const t = useTranslations("Collection.stats");
  const tCondition = useTranslations("Condition");
  const totalJerseys = collectionItems.length;

  const leagueStats = collectionItems.reduce((acc, item) => {
    const leagueName = item.jersey.club.league.name;
    acc[leagueName] = (acc[leagueName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const conditionStats = collectionItems.reduce((acc, item) => {
    const condition = item.condition;
    acc[condition] = (acc[condition] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const giftCount = collectionItems.filter((item) => item.isGift).length;
  const mysteryBoxCount = collectionItems.filter(
    (item) => item.isFromMysteryBox
  ).length;
  const regularCount = collectionItems.filter(
    (item) => !item.isGift && !item.isFromMysteryBox
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-medium text-muted-foreground">{t("owned")}</h3>
        </div>
        <p className="text-2xl font-bold">{totalJerseys}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {totalJerseys === 1 ? t("jerseyInCollection") : t("jerseysInCollection")}
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-medium text-muted-foreground">
            {t("favoriteLeagues")}
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

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <Shirt className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-medium text-muted-foreground">{t("conditions")}</h3>
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
                  {tCondition(condition as "MINT" | "EXCELLENT" | "GOOD" | "FAIR" | "POOR")}
                </span>
                <span className="text-sm text-muted-foreground">{count}</span>
              </div>
            ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <Gift className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-medium text-muted-foreground">{t("source")}</h3>
        </div>
        <div className="space-y-2">
          {regularCount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{t("purchased")}</span>
              <span className="text-sm text-muted-foreground">
                {regularCount}
              </span>
            </div>
          )}
          {giftCount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-1">
                {t("gifts")}
              </span>
              <span className="text-sm text-muted-foreground">{giftCount}</span>
            </div>
          )}
          {mysteryBoxCount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-1">
                {t("mysteryBox")}
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
