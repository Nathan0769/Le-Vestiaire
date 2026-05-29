"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { CollectionJerseyModal } from "./collection-jersey-modal";
import type { CollectionItemWithJersey } from "@/types/collection-page";
import { useTranslations, useLocale } from "next-intl";
import type { JerseyType } from "@/types/jersey";
import { jerseyTypeLabel } from "@/lib/jersey-utils";
import { translateJerseyName } from "@/lib/translate-jersey-name";

interface CollectionJerseyCardProps {
  collectionItem: CollectionItemWithJersey;
  onUpdate?: (updatedItem: CollectionItemWithJersey) => void;
  onDelete?: (deletedItemId: string) => void;
}

export function CollectionJerseyCard({
  collectionItem,
  onUpdate,
  onDelete,
}: CollectionJerseyCardProps) {
  const locale = useLocale();
  const tJerseyType = useTranslations("JerseyType");
  const tCondition = useTranslations("Condition");
  const tVersion = useTranslations("JerseyVersion");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [localItem, setLocalItem] = useState(collectionItem);

  const translatedJerseyName = translateJerseyName({
    jersey: {
      name: localItem.jersey.name,
      type: localItem.jersey.type as JerseyType,
      season: localItem.jersey.season,
      clubShortName: localItem.jersey.club.shortName,
    },
    locale,
    typeTranslation: jerseyTypeLabel(tJerseyType(localItem.jersey.type as JerseyType), localItem.jersey.type, localItem.jersey.variant ?? 1),
  });

  const handleUpdate = (updatedItem: CollectionItemWithJersey) => {
    setLocalItem(updatedItem);
    if (onUpdate) {
      onUpdate(updatedItem);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "MINT":
        return "bg-green-500/20 text-green-700 border-green-200";
      case "EXCELLENT":
        return "bg-blue-500/20 text-blue-700 border-blue-200";
      case "GOOD":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-200";
      case "FAIR":
        return "bg-orange-500/20 text-orange-700 border-orange-200";
      case "POOR":
        return "bg-red-500/20 text-red-700 border-red-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getJerseyTypeLabel = (type: string, variant: number) => {
    return jerseyTypeLabel(tJerseyType(type as JerseyType), type, variant);
  };

  return (
    <>
      <Card
        className="cursor-pointer transition-all hover:shadow-lg group"
        onClick={() => setIsModalOpen(true)}
      >
        <CardContent className="p-3 space-y-3">
          <div className="relative aspect-square">
            <Image
              src={localItem.userPhotoUrl || localItem.jersey.imageUrl}
              alt={translatedJerseyName}
              fill
              className="object-contain group-hover:scale-105 transition-transform"
            />
          </div>

          <div className="space-y-2">
            <p className="text-s font-medium text-center line-clamp-2">
              {localItem.jersey.club.name}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              {getJerseyTypeLabel(localItem.jersey.type, localItem.jersey.variant ?? 1)} •{" "}
              {localItem.jersey.season}
            </p>

            <div className="flex justify-center items-center gap-2 flex-wrap">
              <Badge
                variant="secondary"
                className={`text-xs px-1.5 py-0.5 ${getConditionColor(
                  localItem.condition
                )}`}
              >
                {tCondition(localItem.condition as "MINT" | "EXCELLENT" | "GOOD" | "FAIR" | "POOR")}
              </Badge>

              {localItem.size && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {localItem.size}
                </Badge>
              )}

              {localItem.version && localItem.version !== "REPLICA" && (
                <Badge
                  variant="outline"
                  className="text-xs px-1.5 py-0.5 text-purple-700 bg-purple-500/10 border-purple-200"
                >
                  {tVersion(localItem.version as "REPLICA" | "AUTHENTIC" | "STOCK_PRO" | "PLAYER_ISSUE" | "MATCH_WORN")}
                </Badge>
              )}
            </div>

            {localItem.purchasePrice && (
              <p className="text-xs font-semibold text-center text-primary">
                {localItem.purchasePrice}€
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <CollectionJerseyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        collectionItem={localItem}
        onUpdate={handleUpdate}
        onDelete={onDelete}
      />
    </>
  );
}
