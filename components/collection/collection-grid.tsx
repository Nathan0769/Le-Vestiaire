"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CollectionJerseyCard } from "./collection-jersey-card";
import type { CollectionItemWithJersey } from "@/types/collection-page";

interface CollectionGridProps {
  collectionItems: CollectionItemWithJersey[];
}

export function CollectionGrid({ collectionItems }: CollectionGridProps) {
  const t = useTranslations("Collection.grid");
  const [sortBy, setSortBy] = useState("date-desc");

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

  const sortedItems = [...localItems].sort((a, b) => {
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{t("title")}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("sortBy")}</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
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
            {t("noJerseys")}
          </p>
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
