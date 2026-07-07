"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BrandSegment } from "@/lib/club-stats";
import { normalizeSeason, formatSeasonRange } from "@/lib/season-format";

type Props = {
  timeline: BrandSegment[];
  primaryColor: string;
};

export function BrandTimeline({ timeline, primaryColor }: Props) {
  const t = useTranslations("ClubPage.brandTimeline");

  const formatPeriod = (segment: BrandSegment, isCurrent: boolean): string => {
    if (isCurrent) {
      return `${normalizeSeason(segment.startSeason)} → ${t("today")}`;
    }
    return formatSeasonRange(
      segment.startSeason,
      segment.endSeason,
      t("seasonRangeConnector")
    );
  };

  if (timeline.length === 0) return null;

  const displayTimeline = [...timeline].reverse();
  const currentSegmentKey = displayTimeline[0]
    ? `${displayTimeline[0].brand}-${displayTimeline[0].startSeason}`
    : null;

  if (displayTimeline.length === 1) {
    const only = displayTimeline[0];
    return (
      <div className="rounded-xl border border-border p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          {t("singleTitle")}
        </h2>
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background">
          <span
            aria-hidden="true"
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: primaryColor }}
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">{only.brand}</span>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {formatPeriod(only, true)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-muted-foreground mb-4">
        {t("multipleTitle")}
      </h2>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {displayTimeline.map((segment, i) => {
          const key = `${segment.brand}-${segment.startSeason}`;
          const isCurrent = key === currentSegmentKey;

          return (
            <div key={key} className="flex items-center gap-2 shrink-0">
              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border shrink-0 ${
                  isCurrent
                    ? "border-amber-200/60 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50"
                    : "border-border bg-background"
                }`}
              >
                {isCurrent && (
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  />
                )}
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">
                    {segment.brand}
                  </span>
                  <span
                    className={`text-[10px] tabular-nums ${
                      isCurrent
                        ? "text-amber-900/70 dark:text-amber-100/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatPeriod(segment, isCurrent)}
                  </span>
                </div>
              </div>

              {i < displayTimeline.length - 1 && (
                <ChevronRight
                  aria-hidden="true"
                  className="w-4 h-4 text-muted-foreground shrink-0"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
