"use client";

import { useEffect, type ReactNode } from "react";
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

  const navigateTo = (jersey: AdjacentJersey) => {
    router.push(getJerseyUrl(leagueId, clubId, jersey.slug ?? jersey.id));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (target.isContentEditable) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === "ArrowLeft" && prevJersey) navigateTo(prevJersey);
      else if (e.key === "ArrowRight" && nextJersey) navigateTo(nextJersey);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevJersey, nextJersey]);

  return (
    <div>
      {(prevJersey || nextJersey) && (
        <div className="flex items-center justify-between gap-2 md:gap-4 px-4 md:px-6 py-2 md:py-1.5 mb-4 border-b border-border/50">
          {prevJersey ? (
            <button
              onClick={() => navigateTo(prevJersey)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground active:text-foreground transition-colors cursor-pointer group shrink-0"
            >
              <ChevronLeft className="w-4 h-4 md:w-3.5 md:h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <div className="relative w-8 h-8 md:w-7 md:h-7 rounded bg-white overflow-hidden border border-border/50">
                <Image
                  src={prevJersey.imageUrl}
                  alt={`${tType(prevJersey.type as Parameters<typeof tType>[0])} ${prevJersey.season}`}
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </div>
              <span className="text-xs hidden md:inline">
                {tType(prevJersey.type as Parameters<typeof tType>[0])}{" "}
                <span className="opacity-60">{prevJersey.season}</span>
              </span>
            </button>
          ) : (
            <div className="shrink-0" />
          )}

          <span className="text-xs text-muted-foreground text-center truncate">
            {currentName}
          </span>

          {nextJersey ? (
            <button
              onClick={() => navigateTo(nextJersey)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground active:text-foreground transition-colors cursor-pointer group shrink-0"
            >
              <span className="text-xs hidden md:inline">
                {tType(nextJersey.type as Parameters<typeof tType>[0])}{" "}
                <span className="opacity-60">{nextJersey.season}</span>
              </span>
              <div className="relative w-8 h-8 md:w-7 md:h-7 rounded bg-white overflow-hidden border border-border/50">
                <Image
                  src={nextJersey.imageUrl}
                  alt={`${tType(nextJersey.type as Parameters<typeof tType>[0])} ${nextJersey.season}`}
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </div>
              <ChevronRight className="w-4 h-4 md:w-3.5 md:h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
