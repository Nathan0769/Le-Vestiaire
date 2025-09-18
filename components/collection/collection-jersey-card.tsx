"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { CollectionJerseyModal } from "./collection-jersey-modal";
import { CONDITION_LABELS } from "@/types/collection";
import type { CollectionItemWithJersey } from "@/types/collection-page";

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [localItem, setLocalItem] = useState(collectionItem);

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

  const getJerseyTypeLabel = (type: string) => {
    const typeLabels = {
      HOME: "Domicile",
      AWAY: "Extérieur",
      THIRD: "Third",
      FOURTH: "Fourth",
      GOALKEEPER: "Gardien",
      SPECIAL: "Spécial",
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
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
              src={localItem.jersey.imageUrl}
              alt={localItem.jersey.name}
              fill
              className="object-contain group-hover:scale-105 transition-transform"
            />
          </div>

          <div className="space-y-2">
            <p className="text-s font-medium text-center line-clamp-2">
              {localItem.jersey.club.name}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              {getJerseyTypeLabel(localItem.jersey.type)} •{" "}
              {localItem.jersey.season}
            </p>

            <div className="flex justify-center items-center gap-2">
              <Badge
                variant="secondary"
                className={`text-xs px-1.5 py-0.5 ${getConditionColor(
                  localItem.condition
                )}`}
              >
                {
                  CONDITION_LABELS[
                    localItem.condition as keyof typeof CONDITION_LABELS
                  ]
                }
              </Badge>

              {localItem.size && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {localItem.size}
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
