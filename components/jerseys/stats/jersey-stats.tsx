"use client";

import { useState, useEffect } from "react";
import { Package, Heart } from "lucide-react";

interface JerseyStatsProps {
  jerseyId: string;
}

interface JerseyStatsData {
  collectionCount: number;
  wishlistCount: number;
}

export function JerseyStats({ jerseyId }: JerseyStatsProps) {
  const [statsData, setStatsData] = useState<JerseyStatsData>({
    collectionCount: 0,
    wishlistCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/jerseys/${jerseyId}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStatsData(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [jerseyId]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Statistiques des collectionneurs
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <div className="w-32 h-4 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-muted-foreground" />
            <div className="w-32 h-4 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Statistiques des collectionneurs
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <span className="">
            Dans {statsData.collectionCount.toLocaleString()} collection
            {statsData.collectionCount > 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          <span className="">
            Dans {statsData.wishlistCount.toLocaleString()} wishlist
            {statsData.wishlistCount > 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
