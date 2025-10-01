"use client";

import React from "react";
import type { Theme } from "@/types/theme";
import { THEME_PAGE_CONFIG } from "@/lib/theme";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Gift, Calendar, Shirt, ExternalLink } from "lucide-react";
import Image from "next/image";

interface JerseyData {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  season: string;
  club: {
    name: string;
  };
}

interface SharedWishlistClientProps {
  title: string;
  message?: string;
  theme: Theme;
  jerseys: JerseyData[];
}

export default function SharedWishlistClient({
  title,
  message,
  theme,
  jerseys,
}: SharedWishlistClientProps) {
  const getJerseyTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      HOME: "Domicile",
      AWAY: "Extérieur",
      THIRD: "Third",
      FOURTH: "Fourth",
      GOALKEEPER: "Gardien",
      SPECIAL: "Spécial",
    };
    return typeLabels[type] || type;
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isChristmasTime = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    return month === 12 || month === 1;
  };

  const config = THEME_PAGE_CONFIG[theme] ?? THEME_PAGE_CONFIG.default;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.gradient}`}>
      <div
        className={`bg-white/80 backdrop-blur-sm border-b ${config.border} sticky top-0 z-10`}
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 bg-gradient-to-br ${config.headerGradient} rounded-full flex items-center justify-center`}
            >
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">Le Vestiaire</h1>
              <p className="text-xs text-gray-600">Liste de souhaits</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white/50">
              {jerseys.length} maillot
              {jerseys.length > 1 ? "s" : ""}
            </Badge>
            {isChristmasTime() && <span className="text-lg">🎄</span>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
            {title}
          </h1>

          {message && (
            <div className="max-w-2xl mx-auto">
              <p className="text-lg text-gray-600 leading-relaxed">{message}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{getCurrentDate()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shirt className="w-4 h-4" />
              <span>
                {jerseys.length} maillot
                {jerseys.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {jerseys.map((jersey) => (
            <Card
              key={jersey.id}
              className={`group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm ${config.cardBorder}`}
            >
              <CardContent className="p-6 space-y-4">
                <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
                  <Image
                    src={jersey.imageUrl}
                    alt={jersey.name}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-2 transition-colors">
                      {jersey.club.name}
                    </h3>
                    <p className="text-sm text-gray-600">{jersey.name}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={config.badge}>
                      {getJerseyTypeLabel(jersey.type)}
                    </Badge>
                    <Badge variant="outline" className="bg-white/50">
                      {jersey.season}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className={`text-center space-y-6 pt-8 border-t ${config.border}`}>
          <div className="space-y-3">
            <p className="text-gray-600">Cette liste a été créée avec</p>
            <Button
              asChild
              className={`${config.button} text-white font-medium cursor-pointer`}
            >
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Le Vestiaire Foot
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>Créez votre propre collection de maillots</p>
            <p>et partagez vos envies avec vos proches ⚽</p>
          </div>
        </div>
      </div>
    </div>
  );
}
