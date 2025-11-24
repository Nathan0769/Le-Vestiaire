"use client";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FriendWishlistJerseyCard } from "./friend-wishlist-jersey-card";
import type { FriendWishlistItem } from "@/types/friend-collection";
import { useTranslations } from "next-intl";

interface FriendWishlistGridProps {
  wishlistItems: FriendWishlistItem[];
}

export function FriendWishlistGrid({
  wishlistItems,
}: FriendWishlistGridProps) {
  const t = useTranslations("Wishlist");
  const [sortBy, setSortBy] = useState("date-desc");

  const sortOptions = [
    { value: "date-desc", label: t("recentlyAdded") },
    { value: "date-asc", label: t("oldestAdded") },
    { value: "price-desc", label: t("priceDescending") },
    { value: "price-asc", label: t("priceAscending") },
    { value: "club", label: t("clubAZ") },
  ];

  const sortedItems = [...wishlistItems].sort((a, b) => {
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
        const priceA = a.jersey.retailPrice || 0;
        const priceB = b.jersey.retailPrice || 0;
        return priceB - priceA;
      case "price-asc":
        const priceA2 = a.jersey.retailPrice || 0;
        const priceB2 = b.jersey.retailPrice || 0;
        return priceA2 - priceB2;
      case "club":
        return a.jersey.club.name.localeCompare(b.jersey.club.name);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-medium">{t("wishlist")}</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {t("sortBy")}
          </span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
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
          <p className="text-muted-foreground">{t("emptyWishlist")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 w-full">
          {sortedItems.map((item) => (
            <FriendWishlistJerseyCard key={item.id} wishlistItem={item} />
          ))}
        </div>
      )}
    </div>
  );
}
