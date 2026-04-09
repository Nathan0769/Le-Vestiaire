"use client";

import { useEffect, useRef, type TouchEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { getJerseyUrl } from "@/lib/jersey-url";

interface AdjacentJersey {
  id: string;
  slug: string | null;
  season: string;
  type: string;
  imageUrl: string;
}

interface JerseyNavigatorProps {
  children: ReactNode;
  prevJersey: AdjacentJersey | null;
  nextJersey: AdjacentJersey | null;
  currentName: string;
  leagueId: string;
  clubId: string;
}

export function JerseyNavigator({
  children,
  prevJersey,
  nextJersey,
  currentName,
  leagueId,
  clubId,
}: JerseyNavigatorProps) {
  const router = useRouter();
  const tType = useTranslations("JerseyType");
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const navigateTo = (jersey: AdjacentJersey) => {
    router.push(getJerseyUrl(leagueId, clubId, jersey.slug ?? jersey.id));
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const delta = touchStartX.current - touchEndX.current;
    if (delta > 50 && nextJersey) navigateTo(nextJersey);
    else if (delta < -50 && prevJersey) navigateTo(prevJersey);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prevJersey) navigateTo(prevJersey);
      else if (e.key === "ArrowRight" && nextJersey) navigateTo(nextJersey);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevJersey, nextJersey]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(prevJersey || nextJersey) && (
        <div className="hidden md:flex items-center justify-between gap-4 px-6 py-1.5 mb-4 border-b border-border/50">
          {prevJersey ? (
            <button
              onClick={() => navigateTo(prevJersey)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <div className="relative w-7 h-7 rounded bg-white overflow-hidden border border-border/50">
                <Image src={prevJersey.imageUrl} alt="" fill className="object-contain" sizes="28px" />
              </div>
              <span className="text-xs hidden md:inline">
                {tType(prevJersey.type as Parameters<typeof tType>[0])}{" "}
                <span className="opacity-60">{prevJersey.season}</span>
              </span>
            </button>
          ) : (
            <div className="shrink-0" />
          )}

          <span className="text-xs text-muted-foreground text-center truncate hidden md:block">
            {currentName}
          </span>

          {nextJersey ? (
            <button
              onClick={() => navigateTo(nextJersey)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group shrink-0"
            >
              <span className="text-xs hidden md:inline">
                {tType(nextJersey.type as Parameters<typeof tType>[0])}{" "}
                <span className="opacity-60">{nextJersey.season}</span>
              </span>
              <div className="relative w-7 h-7 rounded bg-white overflow-hidden border border-border/50">
                <Image src={nextJersey.imageUrl} alt="" fill className="object-contain" sizes="28px" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <div className="shrink-0" />
          )}
        </div>
      )}

      {children}
    </div>
  );
}
