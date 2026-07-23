"use client";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Grid2x2, Grid3x3 } from "lucide-react";
import { UserCollectionJerseyCard } from "./user-collection-jersey-card";
import { CollectionFiltersPopover } from "@/components/collection/collection-filters-popover";
import { useCollectionViewMode } from "@/hooks/useCollectionViewMode";
import { comparePinnedFirst } from "@/lib/collection-pin";
import {
  EMPTY_FILTERS,
  applyCollectionFilters,
  countActiveFilters,
  type CollectionFilters,
} from "@/lib/collection-filters";
import type { UserCollectionItem } from "@/types/user-public-collection";
import { useTranslations } from "next-intl";

interface UserCollectionGridProps {
  collectionItems: UserCollectionItem[];
  showPriceSortOptions?: boolean;
}

export function UserCollectionGrid({
  collectionItems,
  showPriceSortOptions = true,
}: UserCollectionGridProps) {
  const t = useTranslations("Friends");
  const tFilters = useTranslations("Collection.filters");
  const tGrid = useTranslations("Collection.grid");
  const [sortBy, setSortBy] = useState("date-desc");
  const [filters, setFilters] = useState<CollectionFilters>(EMPTY_FILTERS);
  const [viewMode, setViewMode] = useCollectionViewMode();

  const allSortOptions = [
    { value: "date-desc", label: t("mostRecent") },
    { value: "date-asc", label: t("oldest") },
    { value: "purchase-date-desc", label: t("purchaseDateMostRecent") },
    { value: "purchase-date-asc", label: t("purchaseDateOldest") },
    { value: "price-desc", label: t("priceDescending") },
    { value: "price-asc", label: t("priceAscending") },
    { value: "condition", label: t("condition") },
    { value: "club", label: t("clubAZ") },
    { value: "season", label: t("season") },
  ];

  const sortOptions = showPriceSortOptions
    ? allSortOptions
    : allSortOptions.filter((o) => !o.value.startsWith("price"));

  const availableLeagues = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of collectionItems) {
      const { name, tier } = item.jersey.club.league;
      if (!map.has(name)) map.set(name, tier);
    }
    return Array.from(map.entries())
      .map(([name, tier]) => ({ name, tier }))
      .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
  }, [collectionItems]);

  const filteredItems = useMemo(
    () => applyCollectionFilters(collectionItems, filters),
    [collectionItems, filters]
  );

  const activeFiltersCount = countActiveFilters(filters);

  const sortedItems = [...filteredItems].sort((a, b) => {
    const pinnedCmp = comparePinnedFirst(a.pinnedAt, b.pinnedAt);
    if (pinnedCmp !== 0) return pinnedCmp;
    switch (sortBy) {
      case "date-desc":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "date-asc":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "purchase-date-desc": {
        const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : null;
        const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : null;
        if (dateA === null && dateB === null) return 0;
        if (dateA === null) return 1;
        if (dateB === null) return -1;
        return dateB - dateA;
      }
      case "purchase-date-asc": {
        const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : null;
        const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : null;
        if (dateA === null && dateB === null) return 0;
        if (dateA === null) return 1;
        if (dateB === null) return -1;
        return dateA - dateB;
      }
      case "price-desc":
        const priceA = a.purchasePrice || 0;
        const priceB = b.purchasePrice || 0;
        return priceB - priceA;
      case "price-asc":
        const priceA2 = a.purchasePrice || 0;
        const priceB2 = b.purchasePrice || 0;
        return priceA2 - priceB2;
      case "condition":
        const conditionOrder = {
          MINT: 1,
          EXCELLENT: 2,
          GOOD: 3,
          FAIR: 4,
          POOR: 5,
        };
        return (
          (conditionOrder[a.condition as keyof typeof conditionOrder] || 99) -
          (conditionOrder[b.condition as keyof typeof conditionOrder] || 99)
        );
      case "club":
        return a.jersey.club.name.localeCompare(b.jersey.club.name);
      case "season":
        return b.jersey.season.localeCompare(a.jersey.season);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium">{t("hisHerJerseys")}</h2>
          {activeFiltersCount > 0 && collectionItems.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {tFilters("resultsCount", { count: sortedItems.length })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial">
            <CollectionFiltersPopover
              filters={filters}
              onChange={setFilters}
              availableLeagues={availableLeagues}
            />
          </div>
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline">
              {t("sortBy")}
            </span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center rounded-md border bg-background overflow-hidden shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setViewMode("showcase")}
                  aria-label={tGrid("viewMode.detailed")}
                  aria-pressed={viewMode === "showcase"}
                  className={`p-1.5 transition-colors ${
                    viewMode === "showcase"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Grid2x2 className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{tGrid("viewMode.detailed")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setViewMode("compact")}
                  aria-label={tGrid("viewMode.compact")}
                  aria-pressed={viewMode === "compact"}
                  className={`p-1.5 transition-colors ${
                    viewMode === "compact"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{tGrid("viewMode.compact")}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {collectionItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("noJerseysInCollection")}</p>
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 gap-3">
          <p className="text-muted-foreground">{tFilters("emptyFiltered")}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilters(EMPTY_FILTERS)}
          >
            {tFilters("reset")}
          </Button>
        </div>
      ) : (
        <div
          className={`grid gap-3 sm:gap-4 w-full ${
            viewMode === "compact"
              ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
              : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          }`}
        >
          {sortedItems.map((item) => (
            <UserCollectionJerseyCard
              key={item.id}
              collectionItem={item}
              compact={viewMode === "compact"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
