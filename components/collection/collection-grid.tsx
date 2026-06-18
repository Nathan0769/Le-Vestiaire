"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CollectionJerseyCard } from "./collection-jersey-card";
import { CollectionFiltersPopover } from "./collection-filters-popover";
import {
  EMPTY_FILTERS,
  applyCollectionFilters,
  countActiveFilters,
  type CollectionFilters,
} from "@/lib/collection-filters";
import type { CollectionItemWithJersey } from "@/types/collection-page";

interface CollectionGridProps {
  collectionItems: CollectionItemWithJersey[];
}

export function CollectionGrid({ collectionItems }: CollectionGridProps) {
  const t = useTranslations("Collection.grid");
  const tFilters = useTranslations("Collection.filters");
  const [sortBy, setSortBy] = useState("date-desc");
  const [filters, setFilters] = useState<CollectionFilters>(EMPTY_FILTERS);

  const [localItems, setLocalItems] = useState(collectionItems);

  const sortOptions = [
    { value: "date-desc", label: t("sortOptions.dateDesc") },
    { value: "date-asc", label: t("sortOptions.dateAsc") },
    { value: "price-desc", label: t("sortOptions.priceDesc") },
    { value: "price-asc", label: t("sortOptions.priceAsc") },
    { value: "condition", label: t("sortOptions.condition") },
    { value: "club", label: t("sortOptions.club") },
    { value: "season", label: t("sortOptions.season") },
  ];

  const handleUpdate = (updatedItem: CollectionItemWithJersey) => {
    setLocalItems((prevItems) =>
      prevItems.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  const handleDelete = (deletedItemId: string) => {
    setLocalItems((prevItems) =>
      prevItems.filter((item) => item.id !== deletedItemId)
    );
  };

  const availableLeagues = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of localItems) {
      const { name, tier } = item.jersey.club.league;
      if (!map.has(name)) map.set(name, tier);
    }
    return Array.from(map.entries())
      .map(([name, tier]) => ({ name, tier }))
      .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
  }, [localItems]);

  const filteredItems = useMemo(
    () => applyCollectionFilters(localItems, filters),
    [localItems, filters]
  );

  const activeFiltersCount = countActiveFilters(filters);

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "date-asc":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium">{t("title")}</h2>
          {activeFiltersCount > 0 && localItems.length > 0 && (
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
            <span className="text-sm text-muted-foreground hidden sm:inline">
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
        </div>
      </div>

      {localItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("noJerseys")}</p>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {sortedItems.map((item) => (
            <CollectionJerseyCard
              key={item.id}
              collectionItem={item}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
