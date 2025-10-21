import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { JerseyCard } from "@/components/jerseys/jerseys/jersey-card";
import { Heart, Shirt, Trophy } from "lucide-react";
import { WishlistShareButton } from "@/components/wishlist/wishlist-share-button";
import WishlistLanding from "@/components/wishlist/wishlist-landing";
import type { Metadata } from "next";

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
  const user = await getCurrentUser();

  if (!user) {
    return <WishlistLanding />;
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1000, // Limite raisonnable pour éviter les problèmes de performance
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la wishlist:", error);
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="w-16 h-16 text-destructive/30 mb-6" />
          <h2 className="text-xl font-medium text-muted-foreground mb-2">
            Erreur lors du chargement de votre wishlist
          </h2>
          <p className="text-muted-foreground max-w-md">
            Une erreur est survenue. Veuillez réessayer plus tard.
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

  const typeStats = wishlistItems.reduce((acc, item) => {
    const type = item.jersey?.type;
    if (!type) return acc;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeLabels = {
    HOME: "Domicile",
    AWAY: "Extérieur",
    THIRD: "Third",
    FOURTH: "Fourth",
    GOALKEEPER: "Gardien",
    SPECIAL: "Spécial",
  };

  const shareableWishlistItems = wishlistItems.map((item) => ({
    id: item.id,
    jersey: {
      id: item.jersey.id,
      name: item.jersey.name,
      imageUrl: item.jersey.imageUrl,
      type: item.jersey.type,
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
          <h1 className="text-2xl font-semibold">Mes Envies</h1>
          <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
            0 maillot
          </span>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="w-16 h-16 text-muted-foreground/30 mb-6" />
          <h2 className="text-xl font-medium text-muted-foreground mb-2">
            Vous n&apos;avez pas de maillot qui vous fait de l&apos;œil
          </h2>
          <p className="text-muted-foreground max-w-md">
            Parcourez notre collection et ajoutez vos maillots préférés à votre
            wishlist !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Mes Envies</h1>
        </div>

        <WishlistShareButton wishlistItems={shareableWishlistItems} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-primary/50 rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-medium text-muted-foreground">
              Maillots voulus
            </h3>
          </div>
          <p className="text-2xl font-bold ">{totalJerseys} </p>
          <p className="text-sm text-muted-foreground mt-1">
            {totalJerseys === 1
              ? "Maillot dans vos envies"
              : "Maillots dans vos envies"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-primary/50 rounded-full flex items-center justify-center">
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

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-primary/50 rounded-full flex items-center justify-center">
              <Shirt className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-medium text-muted-foreground">
              Types préférés
            </h3>
          </div>
          <div className="space-y-2">
            {Object.entries(typeStats)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([type, count]) => {
                const typeLabel = type in typeLabels
                  ? typeLabels[type as keyof typeof typeLabels]
                  : type;
                return (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {typeLabel}
                    </span>
                    <span className="text-sm text-muted-foreground">{count}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Vos maillots</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {wishlistItems.map((item) => (
            <JerseyCard
              key={item.id}
              jersey={{
                id: item.jersey.id,
                name: item.jersey.name,
                imageUrl: item.jersey.imageUrl,
                type: item.jersey.type,
              }}
              leagueId={item.jersey.club.league.id}
              club={item.jersey.club}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
