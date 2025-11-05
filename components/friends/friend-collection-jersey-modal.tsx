"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tag, Package, Star, Gift } from "lucide-react";
import { CONDITION_LABELS } from "@/types/collection";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { FriendCollectionItem } from "@/types/friend-collection";
import { ImageCarousel } from "@/components/collection/image-carousel";

interface FriendCollectionJerseyModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionItem: FriendCollectionItem;
}

export function FriendCollectionJerseyModal({
  isOpen,
  onClose,
  collectionItem,
}: FriendCollectionJerseyModalProps) {
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

  const carouselImages = [];

  if (collectionItem.userPhotoUrl) {
    carouselImages.push({
      src: collectionItem.userPhotoUrl,
      alt: "Photo personnelle",
      label: "Photo personnelle",
    });
  }

  carouselImages.push({
    src: collectionItem.jersey.imageUrl,
    alt: collectionItem.jersey.name,
    label: "Photo officielle",
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Détails du maillot
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <ImageCarousel images={carouselImages} />

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className={`${getConditionColor(collectionItem.condition)}`}
                >
                  {
                    CONDITION_LABELS[
                      collectionItem.condition as keyof typeof CONDITION_LABELS
                    ]
                  }
                </Badge>

                {collectionItem.size && (
                  <Badge variant="outline">Taille {collectionItem.size}</Badge>
                )}

                {collectionItem.hasTags && (
                  <Badge variant="outline" className="text-green-600">
                    <Tag className="w-3 h-3 mr-1" />
                    Avec étiquettes
                  </Badge>
                )}

                {collectionItem.isGift && (
                  <Badge
                    variant="outline"
                    className="text-primary bg-primary/20"
                  >
                    <Gift className="w-3 h-3 mr-1" />
                    Cadeau
                  </Badge>
                )}

                {collectionItem.isFromMysteryBox && (
                  <Badge
                    variant="outline"
                    className="text-primary bg-primary/20"
                  >
                    <Package className="w-3 h-3 mr-1" />
                    Box mystère
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  {collectionItem.jersey.name}
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Club</span>
                    <span className="font-medium">
                      {collectionItem.jersey.club.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ligue</span>
                    <span className="font-medium">
                      {collectionItem.jersey.club.league.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">
                      {getJerseyTypeLabel(collectionItem.jersey.type)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Saison</span>
                    <span className="font-medium">
                      {collectionItem.jersey.season}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Marque</span>
                    <span className="font-medium">
                      {collectionItem.jersey.brand}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Informations de collection
                </h4>

                <div className="space-y-2 text-sm">
                  {collectionItem.purchasePrice && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Prix d&apos;achat
                      </span>
                      <span className="font-semibold text-primary">
                        {collectionItem.purchasePrice}€
                      </span>
                    </div>
                  )}

                  {collectionItem.purchaseDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Acheté le</span>
                      <span className="font-medium">
                        {format(
                          new Date(collectionItem.purchaseDate),
                          "dd MMMM yyyy",
                          { locale: fr }
                        )}
                      </span>
                    </div>
                  )}

                  {collectionItem.personalization && (
                    <>
                      {(() => {
                        const parts =
                          collectionItem.personalization!.split(" ");
                        if (parts.length >= 2) {
                          const number = parts[parts.length - 1];
                          const playerName = parts.slice(0, -1).join(" ");

                          if (/^\d+$/.test(number)) {
                            return (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Joueur
                                  </span>
                                  <span className="font-medium">
                                    {playerName}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Numéro
                                  </span>
                                  <span className="font-medium">{number}</span>
                                </div>
                              </>
                            );
                          }
                        }

                        return (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Personnalisation
                            </span>
                            <span className="font-medium">
                              {collectionItem.personalization}
                            </span>
                          </div>
                        );
                      })()}
                    </>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ajouté le</span>
                    <span className="font-medium">
                      {format(
                        new Date(collectionItem.createdAt),
                        "dd MMMM yyyy",
                        { locale: fr }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 cursor-pointer"
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
