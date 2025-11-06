import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  Heart,
  TrendingUp,
  ArrowRight,
  Trophy,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { UserHomeStats } from "@/types/home";
import { useTranslations, useLocale } from "next-intl";
import { translateJerseyName } from "@/lib/translate-jersey-name";
import type { JerseyType } from "@/types/jersey";

interface UserStatsSectionProps {
  userStats: UserHomeStats;
}

export function UserStatsSection({ userStats }: UserStatsSectionProps) {
  const t = useTranslations("HomePage.userStats");
  const tJerseyType = useTranslations("JerseyType");
  const locale = useLocale();

  const topLeague = Object.entries(userStats.collection.leagueStats).sort(
    ([, a], [, b]) => b - a
  )[0];

  const getTranslatedName = (jersey: { name: string; type: string; season: string; club: { shortName: string } }) => {
    return translateJerseyName({
      jersey: {
        name: jersey.name,
        type: jersey.type as JerseyType,
        season: jersey.season,
        clubShortName: jersey.club.shortName,
      },
      locale,
      typeTranslation: tJerseyType(jersey.type as JerseyType),
    });
  };

  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Collection */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-primary" />
                {t("myCollection")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {userStats.collection.total}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {userStats.collection.total === 1
                  ? t("jerseyCollected")
                  : t("jerseysCollected")}
              </p>

              {userStats.collection.totalValue && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="font-medium">
                    {userStats.collection.totalValue.toFixed(0)}€ {t("invested")}
                  </span>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                asChild
                className="mt-4 p-0 h-auto hover:text-primary"
              >
                <Link href="/collection" className="flex items-center gap-1">
                  {t("viewMyCollection")}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Wishlist */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="w-5 h-5 text-red-500" />
                {t("myWishlist")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {userStats.wishlist.total}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {userStats.wishlist.total === 1
                  ? t("jerseyDesired")
                  : t("jerseysDesired")}
              </p>

              <Button
                variant="ghost"
                size="sm"
                asChild
                className="mt-4 p-0 h-auto hover:text-primary"
              >
                <Link href="/wishlist" className="flex items-center gap-1">
                  {t("viewMyWishlist")}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Ligue Favorite */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="w-5 h-5 text-primary" />
                {t("favoriteLeague")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topLeague ? (
                <>
                  <div className="text-3xl font-bold mb-2">{topLeague[1]}</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("jerseysFrom")} {topLeague[0]}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("startCollection")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {(userStats.collection.recentItems.length > 0 ||
          userStats.wishlist.recentItems.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {userStats.collection.recentItems.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  {t("recentAdditionsCollection")}
                </h3>
                <div className="space-y-3">
                  {userStats.collection.recentItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/50"
                    >
                      <div className="relative w-12 h-12 bg-white rounded-md overflow-hidden flex-shrink-0">
                        <Image
                          src={item.jersey.imageUrl}
                          alt={getTranslatedName(item.jersey)}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {getTranslatedName(item.jersey)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.jersey.club.name}
                        </p>
                      </div>
                      {item.purchasePrice && (
                        <div className="text-sm font-medium text-green-600">
                          {item.purchasePrice}€
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userStats.wishlist.recentItems.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  {t("recentAdditionsWishlist")}
                </h3>
                <div className="space-y-3">
                  {userStats.wishlist.recentItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/50"
                    >
                      <div className="relative w-12 h-12 bg-white rounded-md overflow-hidden flex-shrink-0">
                        <Image
                          src={item.jersey.imageUrl}
                          alt={getTranslatedName(item.jersey)}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {getTranslatedName(item.jersey)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.jersey.club.name}
                        </p>
                      </div>
                      <Heart className="w-4 h-4 text-red-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
