"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS, es } from "date-fns/locale";
import type { RecentJersey } from "@/types/home";
import { useTranslations, useLocale } from "next-intl";
import { useJerseyTypeTranslation } from "@/lib/translations";

interface RecentSectionProps {
  jerseys?: RecentJersey[];
}

export function RecentSection({
  jerseys: ssrJerseys,
}: RecentSectionProps = {}) {
  const t = useTranslations("HomePage.recent");
  const jerseyType = useJerseyTypeTranslation();
  const locale = useLocale();
  const [jerseys, setJerseys] = useState<RecentJersey[]>(ssrJerseys || []);
  const [loading, setLoading] = useState(!ssrJerseys);

  useEffect(() => {
    if (ssrJerseys) return;
    const fetchRecent = async () => {
      try {
        const res = await fetch("/api/home/recent?limit=6");
        if (res.ok) {
          const data = await res.json();
          setJerseys(data.jerseys);
        }
      } catch (error) {
        console.error("Erreur recent jerseys:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, [ssrJerseys]);

  const getDateFnsLocale = () => {
    switch (locale) {
      case "en":
        return enUS;
      case "es":
        return es;
      case "fr":
      default:
        return fr;
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: getDateFnsLocale(),
      });
    } catch {
      return t("recently");
    }
  };

  if (loading) {
    return (
      <section className="py-16 px-6 bg-muted/30">
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
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold">{t("title")}</h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
          {jerseys.map((jersey) => (
            <Link
              key={jersey.id}
              href={`/jerseys/${jersey.club.league.id}/clubs/${jersey.club.id}/jerseys/${jersey.id}`}
              className="group relative"
            >
              <div className="relative">
                <div className="absolute -top-2 -right-2 z-10 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                  {t("new")}
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
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{getTimeAgo(jersey.createdAt)}</span>
                  </div>

                  <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {jersey.club.name}
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    {jerseyType(jersey.type)} • {jersey.season}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-primary font-medium">
                      {jersey.club.league.name}
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
