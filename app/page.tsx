"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { HeroSection } from "@/components/home/hero-section";
import { UserStatsSection } from "@/components/home/user-stats-section";
import { TopRatedSection } from "@/components/home/top-rated-section";
import { RecentSection } from "@/components/home/recent-section";

interface UserStats {
  collection: { total: number };
  wishlist: { total: number };
}

export default function HomePage() {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  useEffect(() => {
    // Récupérer les stats utilisateur si connecté
    if (user) {
      const fetchUserStats = async () => {
        try {
          const res = await fetch("/api/home/user-stats");
          if (res.ok) {
            const data = await res.json();
            setUserStats({
              collection: { total: data.collection.total },
              wishlist: { total: data.wishlist.total },
            });
          }
        } catch (error) {
          console.error("Erreur stats hero:", error);
        }
      };

      fetchUserStats();
    }
  }, [user]);

  return (
    <div className="min-h-screen">
      {/* Hero Section avec background vestiaire */}
      <HeroSection userStats={userStats} />

      {/* Section stats personnelles - uniquement si connecté */}
      {user && <UserStatsSection />}

      <TopRatedSection />

      {/* Section nouveautés */}
      <RecentSection />
    </div>
  );
}
