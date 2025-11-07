"use client";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FriendCollectionJerseyCard } from "./friend-collection-jersey-card";
import type { FriendCollectionItem } from "@/types/friend-collection";
import { useTranslations } from "next-intl";

interface FriendCollectionGridProps {
  collectionItems: FriendCollectionItem[];
}

export function FriendCollectionGrid({
  collectionItems,
}: FriendCollectionGridProps) {
  const t = useTranslations("Friends");
  const [sortBy, setSortBy] = useState("date-desc");

  const sortOptions = [
    { value: "date-desc", label: t("mostRecent") },
    { value: "date-asc", label: t("oldest") },
    { value: "price-desc", label: t("priceDescending") },
    { value: "price-asc", label: t("priceAscending") },
    { value: "condition", label: t("condition") },
    { value: "club", label: t("clubAZ") },
    { value: "season", label: t("season") },
  ];

  const sortedItems = [...collectionItems].sort((a, b) => {
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
    <div className="space-y-6 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-medium">{t("hisHerJerseys")}</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
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

      {sortedItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {t("noJerseysInCollection")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 w-full">
          {sortedItems.map((item) => (
            <FriendCollectionJerseyCard key={item.id} collectionItem={item} />
          ))}
        </div>
      )}
    </div>
  );
}
