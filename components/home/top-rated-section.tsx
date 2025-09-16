"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, ArrowRight, Award } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface TopRatedJersey {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  season: string;
  brand: string;
  club: {
    id: string;
    name: string;
    shortName: string;
    league: {
      id: string;
      name: string;
    };
  };
  averageRating: number;
  totalRatings: number;
}

interface TopRatedSectionProps {
  jerseys?: TopRatedJersey[];
}

export function TopRatedSection({
  jerseys: ssrJerseys,
}: TopRatedSectionProps = {}) {
  const [jerseys, setJerseys] = useState<TopRatedJersey[]>(ssrJerseys || []);
  const [loading, setLoading] = useState(!ssrJerseys);

  useEffect(() => {
    if (ssrJerseys) return; // Pas de fetch si SSR
    const fetchTopRated = async () => {
      try {
        const res = await fetch("/api/home/top-rated?limit=6");
        if (res.ok) {
          const data = await res.json();
          setJerseys(data.jerseys);
        }
      } catch (error) {
        console.error("Erreur top rated:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopRated();
  }, [ssrJerseys]);

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

  if (loading) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="h-8 bg-muted rounded w-64 mx-auto mb-4" />
            <div className="h-4 bg-muted rounded w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted aspect-square rounded-lg mb-3" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

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
                {index < 6 && (
                  <div className="absolute -top-2 -left-2 z-10 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                )}

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
