"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, ArrowRight, Award } from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import type { TopRatedJersey } from "@/types/home";
import { useTranslations } from "next-intl";
import { useJerseyTypeTranslation } from "@/lib/translations";

interface TopRatedSectionProps {
  jerseys?: TopRatedJersey[];
}

export function TopRatedSection({
  jerseys: ssrJerseys,
}: TopRatedSectionProps = {}) {
  const t = useTranslations("HomePage.topRated");
  const jerseyType = useJerseyTypeTranslation();
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;

      let fill = 0;
      if (rating >= starValue) {
        fill = 1;
      } else if (rating >= starValue - 0.5) {
        fill = 0.5;
      }

      return (
        <div key={index} className="relative">
          <Star
            className={`w-3 h-3 transition-colors ${
              fill > 0
                ? "text-yellow-400 stroke-yellow-400"
                : "text-muted-foreground/40 stroke-muted-foreground/40"
            }`}
            strokeWidth={2}
            fill="none"
          />

          {fill > 0 && (
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{
                clipPath: fill === 0.5 ? "inset(0 50% 0 0)" : "none",
              }}
            >
              <Star
                className="w-3 h-3 text-yellow-400 fill-yellow-400 stroke-yellow-400"
                strokeWidth={2}
              />
            </div>
          )}
        </div>
      );
    });
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
            <h2 className="text-3xl md:text-4xl font-bold">{t("title")}</h2>
            <Award className="w-6 h-6 text-yellow-500" />
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
          {jerseys.map((jersey, index) => (
            <Link
              key={jersey.id}
              href={`/jerseys/${jersey.club.league.id || "unknown"}/clubs/${
                jersey.club.id
              }/jerseys/${jersey.id}`}
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
                    {jerseyType(jersey.type)} • {jersey.season}
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
              {t("viewAll")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
