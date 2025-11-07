"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { FriendCollectionJerseyModal } from "./friend-collection-jersey-modal";
import { CONDITION_LABELS } from "@/types/collection";
import type { FriendCollectionItem } from "@/types/friend-collection";
import { useTranslations, useLocale } from "next-intl";
import { translateJerseyName } from "@/lib/translate-jersey-name";
import type { JerseyType } from "@/types/jersey";

interface FriendCollectionJerseyCardProps {
  collectionItem: FriendCollectionItem;
}

export function FriendCollectionJerseyCard({
  collectionItem,
}: FriendCollectionJerseyCardProps) {
  const locale = useLocale();
  const tJerseyType = useTranslations("JerseyType");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const translatedJerseyName = translateJerseyName({
    jersey: {
      name: collectionItem.jersey.name,
      type: collectionItem.jersey.type as JerseyType,
      season: collectionItem.jersey.season,
      clubShortName: collectionItem.jersey.club.shortName,
    },
    locale,
    typeTranslation: tJerseyType(collectionItem.jersey.type as JerseyType),
  });

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

  return (
    <>
      <Card
        className="cursor-pointer transition-all hover:shadow-lg group w-full overflow-hidden"
        onClick={() => setIsModalOpen(true)}
      >
        <CardContent className="p-3 space-y-3">
          <div className="relative aspect-square w-full overflow-hidden">
            <Image
              src={collectionItem.jersey.imageUrl}
              alt={translatedJerseyName}
              fill
              className="object-contain group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="space-y-2 min-w-0">
            <p className="text-sm font-medium text-center line-clamp-2 break-words">
              {collectionItem.jersey.club.name}
            </p>
            <p className="text-xs text-muted-foreground text-center truncate">
              {tJerseyType(collectionItem.jersey.type as JerseyType)} •{" "}
              {collectionItem.jersey.season}
            </p>
            <div className="flex justify-center items-center gap-2 flex-wrap">
              <Badge
                variant="secondary"
                className={`text-xs px-1.5 py-0.5 ${getConditionColor(
                  collectionItem.condition
                )}`}
              >
                {
                  CONDITION_LABELS[
                    collectionItem.condition as keyof typeof CONDITION_LABELS
                  ]
                }
              </Badge>
              {collectionItem.size && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {collectionItem.size}
                </Badge>
              )}
            </div>
            {collectionItem.purchasePrice && (
              <p className="text-xs font-semibold text-center text-primary">
                {collectionItem.purchasePrice}€
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <FriendCollectionJerseyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        collectionItem={collectionItem}
      />
    </>
  );
}
