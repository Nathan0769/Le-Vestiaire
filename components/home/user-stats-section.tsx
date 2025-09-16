import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  Heart,
  TrendingUp,
  ArrowRight,
  Trophy,
  Star,
  Award,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { UserHomeStats } from "@/types/home";

interface UserStatsSectionProps {
  userStats: UserHomeStats;
}

export function UserStatsSection({ userStats }: UserStatsSectionProps) {
  const topLeague = Object.entries(userStats.collection.leagueStats).sort(
    ([, a], [, b]) => b - a
  )[0];

  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Votre Collection
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Un aperçu de votre passion pour les maillots de football
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Collection */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-primary" />
                Ma Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {userStats.collection.total}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {userStats.collection.total === 1
                  ? "Maillot collecté"
                  : "Maillots collectés"}
              </p>

              {userStats.collection.totalValue && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="font-medium">
                    {userStats.collection.totalValue.toFixed(0)}€ investis
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
                  Voir ma collection
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
                Mes Envies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {userStats.wishlist.total}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {userStats.wishlist.total === 1
                  ? "Maillot désiré"
                  : "Maillots désirés"}
              </p>

              <Button
                variant="ghost"
                size="sm"
                asChild
                className="mt-4 p-0 h-auto hover:text-primary"
              >
                <Link href="/wishlist" className="flex items-center gap-1">
                  Voir ma wishlist
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
                Ligue Favorite
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topLeague ? (
                <>
                  <div className="text-3xl font-bold mb-2">{topLeague[1]}</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Maillots de {topLeague[0]}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Commencez votre collection pour voir vos stats !
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
                  Derniers ajouts à votre collection
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
                          alt={item.jersey.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {item.jersey.name}
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
                  Derniers ajouts à vos envies
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
                          alt={item.jersey.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {item.jersey.name}
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

interface TopRatedSectionProps {
  jerseys: Array<{
    id: string;
    name: string;
    imageUrl: string;
    type: string;
    season: string;
    brand: string;
    club: {
      id: string;
      name: string;
      league: { id: string; name: string };
    };
    averageRating: number;
    totalRatings: number;
  }>;
}

export function TopRatedSection({ jerseys }: TopRatedSectionProps) {
  const getJerseyTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "home":
        return "Domicile";
      case "away":
        return "Extérieur";
      case "third":
        return "Third";
      case "fourth":
        return "Fourth";
      case "special":
        return "Spécial";
      case "goalkeeper":
        return "Gardien";
      default:
        return type;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-yellow-400"
            : "text-muted-foreground"
        }`}
      />
    ));
  };

  if (jerseys.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-3xl md:text-4xl font-bold">Les Mieux Notés</h2>
            <Award className="w-6 h-6 text-yellow-500" />
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Découvrez les maillots les plus appréciés par la communauté
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
          {jerseys.map((jersey, index) => (
            <Link
              key={jersey.id}
              href={`/jerseys/${jersey.club.league.id}/clubs/${jersey.club.id}/jerseys/${jersey.id}`}
              className="group relative"
            >
              <div className="relative">
                <div className="absolute -top-2 -left-2 z-10 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {index + 1}
                </div>

                <div className="aspect-square bg-white rounded-lg border border-border overflow-hidden mb-3 group-hover:shadow-lg transition-all duration-200">
                  <Image
                    src={jersey.imageUrl}
                    alt={jersey.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    {renderStars(jersey.averageRating)}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({jersey.totalRatings})
                    </span>
                  </div>

                  <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {jersey.club.name}
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    {getJerseyTypeLabel(jersey.type)} • {jersey.season}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary">
                      {jersey.averageRating.toFixed(1)} ⭐
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {jersey.brand}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Button asChild variant="outline">
            <Link href="/jerseys" className="gap-2">
              Voir tous les maillots
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
