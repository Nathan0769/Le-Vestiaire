import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { Heart, PiggyBank, Shirt, Trophy } from "lucide-react";
import { WishlistShareButton } from "@/components/wishlist/wishlist-share-button";
import { WishlistJerseyCard } from "@/components/wishlist/wishlist-jersey-card";
import WishlistLanding from "@/components/wishlist/wishlist-landing";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "Ma Wishlist de Maillots de Foot | Le Vestiaire - Liste d'Envies à Partager",
  description:
    "Créez votre wishlist de maillots de football et partagez-la facilement avec vos proches. Formats lien, image et PDF disponibles pour Noël, anniversaires et occasions spéciales.",
  keywords: [
    "wishlist maillots foot",
    "liste envies maillots football",
    "partager wishlist maillots",
    "idées cadeaux maillots foot",
    "liste noel maillots football",
    "liste anniversaire maillots",
    "wishlist maillots à partager",
    "souhaits maillots football",
    "liste cadeaux maillots foot",
    "wishlist football personnalisée",
  ],
  openGraph: {
    title: "Wishlist de Maillots | Le Vestiaire Foot",
    description:
      "Créez et partagez votre liste d'envies de maillots de football avec vos proches",
    type: "website",
  },
};

export default async function WishlistPage() {
  const t = await getTranslations("Wishlist.page");
  const user = await getCurrentUser();

  if (!user) {
    return <WishlistLanding r2JerseysUrl={process.env.CLOUDFLARE_R2_PUBLIC_URL!} />;
  }

  let wishlistItems;
  try {
    wishlistItems = await prisma.wishlist.findMany({
      where: {
        userId: user.id,
      },
      include: {
        jersey: {
          include: {
            club: {
              include: {
                league: true,
              },
            },
            cfsAvailability: {
              select: {
                id: true,
                price: true,
                promoPrice: true,
                affiliateUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1000,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la wishlist:", error);
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="w-16 h-16 text-destructive/30 mb-6" />
          <h2 className="text-xl font-medium text-muted-foreground mb-2">
            {t("error.title")}
          </h2>
          <p className="text-muted-foreground max-w-md">
            {t("error.description")}
          </p>
        </div>
      </div>
    );
  }

  const totalJerseys = wishlistItems.length;

  const leagueStats = wishlistItems.reduce((acc, item) => {
    const leagueName = item.jersey?.club?.league?.name;
    if (!leagueName) return acc;
    acc[leagueName] = (acc[leagueName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const promoItems = wishlistItems.filter((item) => {
    const av = item.jersey.cfsAvailability;
    if (!av) return false;
    return av.promoPrice !== null && Number(av.promoPrice) < Number(av.price);
  });
  const availableItems = wishlistItems.filter((item) => {
    const av = item.jersey.cfsAvailability;
    if (!av) return false;
    return !(av.promoPrice !== null && Number(av.promoPrice) < Number(av.price));
  });
  const unavailableItems = wishlistItems.filter(
    (item) => !item.jersey.cfsAvailability
  );

  const savingsAmount = promoItems.reduce((sum, item) => {
    const av = item.jersey.cfsAvailability!;
    return sum + (Number(av.price) - Number(av.promoPrice));
  }, 0);
  const availableCount = promoItems.length + availableItems.length;
  const topLeague = Object.entries(leagueStats).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0];

  const shareableWishlistItems = wishlistItems.map((item) => ({
    id: item.id,
    jersey: {
      id: item.jersey.id,
      name: item.jersey.name,
      imageUrl: item.jersey.imageUrl,
      type: item.jersey.type,
      variant: item.jersey.variant ?? 1,
      season: item.jersey.season,
      club: {
        name: item.jersey.club.name,
      },
    },
  }));

  if (wishlistItems.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
            {t("jerseyCount", { count: 0 })}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="w-16 h-16 text-muted-foreground/30 mb-6" />
          <h2 className="text-xl font-medium text-muted-foreground mb-2">
            {t("empty.title")}
          </h2>
          <p className="text-muted-foreground max-w-md mb-6">
            {t("empty.description")}
          </p>
          <Link
            href="/jerseys"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Shirt className="w-4 h-4" />
            {t("empty.cta")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
        </div>

        <WishlistShareButton wishlistItems={shareableWishlistItems} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("hero.total")}
            </span>
          </div>
          <p className="text-2xl font-bold leading-tight">{totalJerseys}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalJerseys === 1
              ? t("stats.wantedSingular")
              : t("stats.wantedPlural")}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Shirt className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("hero.availableCfs")}
            </span>
          </div>
          <p className="text-2xl font-bold leading-tight">{availableCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("hero.availableSubtitle", { total: totalJerseys })}
          </p>
        </div>

        <div
          className={`rounded-xl p-4 border ${
            savingsAmount > 0
              ? "bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/30"
              : "bg-card border-border"
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                savingsAmount > 0
                  ? "bg-green-600/20"
                  : "bg-muted"
              }`}
            >
              <PiggyBank
                className={`w-3.5 h-3.5 ${
                  savingsAmount > 0
                    ? "text-green-700 dark:text-green-400"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <span
              className={`text-xs font-medium uppercase tracking-wide ${
                savingsAmount > 0
                  ? "text-green-800 dark:text-green-300"
                  : "text-muted-foreground"
              }`}
            >
              {t("hero.savings")}
            </span>
          </div>
          <p
            className={`text-2xl font-bold leading-tight ${
              savingsAmount > 0
                ? "text-green-700 dark:text-green-400"
                : ""
            }`}
          >
            {savingsAmount > 0 ? `-${Math.round(savingsAmount)}€` : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {promoItems.length > 0
              ? t("hero.savingsSubtitle", { count: promoItems.length })
              : t("hero.noPromo")}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("hero.topLeague")}
            </span>
          </div>
          <p className="text-lg font-bold leading-tight truncate">
            {topLeague ?? "—"}
          </p>
          {topLeague && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("hero.topLeagueSubtitle", { count: leagueStats[topLeague] })}
            </p>
          )}
        </div>
      </div>

      {(() => {
        const renderGrid = (items: typeof wishlistItems) => (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => {
              const av = item.jersey.cfsAvailability;
              return (
                <div key={item.id} id={`wishlist-item-${item.jersey.id}`}>
                  <WishlistJerseyCard
                    jersey={{
                      id: item.jersey.id,
                      name: item.jersey.name,
                      imageUrl: item.jersey.imageUrl,
                      type: item.jersey.type,
                      slug: item.jersey.slug,
                      season: item.jersey.season,
                      variant: item.jersey.variant ?? 1,
                      brand: item.jersey.brand,
                    }}
                    club={{
                      id: item.jersey.club.id,
                      name: item.jersey.club.name,
                      shortName: item.jersey.club.shortName,
                      logoUrl: item.jersey.club.logoUrl,
                      leagueId: item.jersey.club.league.id,
                    }}
                    cfsAvailability={
                      av
                        ? {
                            id: av.id,
                            price: av.price.toString(),
                            promoPrice: av.promoPrice
                              ? av.promoPrice.toString()
                              : null,
                            affiliateUrl: av.affiliateUrl,
                          }
                        : null
                    }
                  />
                </div>
              );
            })}
          </div>
        );

        return (
          <div className="space-y-10">
            {promoItems.length > 0 && (
              <section>
                <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-600" />
                  {t("sections.promo", { count: promoItems.length })}
                </h2>
                {renderGrid(promoItems)}
              </section>
            )}

            {availableItems.length > 0 && (
              <section>
                <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {t("sections.available", { count: availableItems.length })}
                </h2>
                {renderGrid(availableItems)}
              </section>
            )}

            {unavailableItems.length > 0 && (
              <section>
                <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                  {t("sections.unavailable", { count: unavailableItems.length })}
                </h2>
                {renderGrid(unavailableItems)}
              </section>
            )}
          </div>
        );
      })()}
    </div>
  );
}
