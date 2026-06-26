import { getTranslations, getLocale } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { Trophy, Shirt, Medal, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getGlobalStatsCached } from "@/lib/global-stats";

function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

export async function CommunityHighlights() {
  const t = await getTranslations("HomePage.communityHighlights");
  const locale = await getLocale();
  const stats = await getGlobalStatsCached();

  const topClub = stats.topClubs[0] ?? null;
  const topLeague = stats.topLeagues[0] ?? null;
  const { mostOwnedJersey, totalCollectedJerseys } = stats;

  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">{t("title")}</h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 items-center text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              {t("topClub")}
            </span>
            {topClub ? (
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-12 h-12">
                  <Image
                    src={topClub.logoUrl}
                    alt={topClub.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <span className="text-lg font-semibold">{topClub.name}</span>
                <span className="text-xs text-muted-foreground">
                  {t("jerseysCount", { count: topClub.count })}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </Card>

          <Card className="p-6 items-center text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Shirt className="w-6 h-6 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              {t("mostOwnedJersey")}
            </span>
            {mostOwnedJersey ? (
              <Link
                href={`/jerseys/${mostOwnedJersey.leagueId}/clubs/${mostOwnedJersey.clubId}/jerseys/${mostOwnedJersey.id}`}
                className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="relative w-16 h-16">
                  <Image
                    src={mostOwnedJersey.imageUrl}
                    alt={mostOwnedJersey.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <span className="text-sm font-semibold line-clamp-2">
                  {mostOwnedJersey.clubName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("collectorsCount", { count: mostOwnedJersey.ownersCount })}
                </span>
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </Card>

          <Card className="p-6 items-center text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Medal className="w-6 h-6 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              {t("topLeague")}
            </span>
            {topLeague ? (
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-12 h-12">
                  {topLeague.logoDarkUrl ? (
                    <>
                      <Image
                        src={topLeague.logoUrl}
                        alt={topLeague.name}
                        fill
                        className="object-contain dark:hidden"
                        unoptimized
                      />
                      <Image
                        src={topLeague.logoDarkUrl}
                        alt={topLeague.name}
                        fill
                        className="object-contain hidden dark:block"
                        unoptimized
                      />
                    </>
                  ) : (
                    <Image
                      src={topLeague.logoUrl}
                      alt={topLeague.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  )}
                </div>
                <span className="text-lg font-semibold">{topLeague.name}</span>
                <span className="text-xs text-muted-foreground">
                  {t("jerseysCount", { count: topLeague.count })}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </Card>

          <Card className="p-6 items-center text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              {t("totalCollected")}
            </span>
            <span className="text-3xl font-bold tabular-nums">
              {formatNumber(totalCollectedJerseys, locale)}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("inCollections")}
            </span>
          </Card>
        </div>
      </div>
    </section>
  );
}
