"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Heart, TrendingUp, ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface UserStats {
  collection: {
    total: number;
    totalValue: number | null;
    recentItems: Array<{
      id: string;
      jersey: {
        id: string;
        name: string;
        imageUrl: string;
        type: string;
        club: {
          id: string;
          name: string;
          shortName: string;
          league: {
            id: string;
            name: string;
          };
        };
      };
      purchasePrice: number | null;
      createdAt: string;
    }>;
    leagueStats: Record<string, number>;
  };
  wishlist: {
    total: number;
    recentItems: Array<{
      id: string;
      jersey: {
        id: string;
        name: string;
        imageUrl: string;
        type: string;
        club: {
          id: string;
          name: string;
          shortName: string;
          league: {
            id: string;
            name: string;
          };
        };
      };
      createdAt: string;
    }>;
  };
}

export function UserStatsSection() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/home/user-stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Erreur stats utilisateur:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-1/2 mb-4" />
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-5/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!stats) {
    return null;
  }

  const topLeague = Object.entries(stats.collection.leagueStats).sort(
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
                {stats.collection.total}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {stats.collection.total === 1
                  ? "Maillot collecté"
                  : "Maillots collectés"}
              </p>

              {stats.collection.totalValue && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="font-medium">
                    {stats.collection.totalValue.toFixed(0)}€ investis
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

          {/* wishlist */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="w-5 h-5 text-red-500" />
                Mes Envies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {stats.wishlist.total}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {stats.wishlist.total === 1
                  ? "Maillot désiré"
                  : "Maillots désirés"}
              </p>

              <Button
                variant="ghost"
                size="sm"
                asChild
                className="mt-4 p-0 h-auto hover:text-primary"
              >
                <Link href="/wishlist" className="flex items-center gap-1 ">
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

        {/* Aperçu des derniers ajouts */}
        {(stats.collection.recentItems.length > 0 ||
          stats.wishlist.recentItems.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Derniers ajouts collection */}
            {stats.collection.recentItems.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Derniers ajouts à votre collection
                </h3>
                <div className="space-y-3">
                  {stats.collection.recentItems.slice(0, 3).map((item) => (
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

            {/* Derniers ajouts wishlist */}
            {stats.wishlist.recentItems.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Derniers ajouts à vos envies
                </h3>
                <div className="space-y-3">
                  {stats.wishlist.recentItems.slice(0, 3).map((item) => (
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
