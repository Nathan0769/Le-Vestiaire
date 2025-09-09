"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import {
  Calendar,
  Euro,
  FileText,
  Tag,
  User,
  Package,
  Star,
} from "lucide-react";
import { CONDITION_LABELS } from "@/types/collection";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { CollectionItemWithJersey } from "@/types/collection-page";

interface CollectionJerseyModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionItem: CollectionItemWithJersey;
}

export function CollectionJerseyModal({
  isOpen,
  onClose,
  collectionItem,
}: CollectionJerseyModalProps) {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Détails de votre maillot
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image du maillot */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-lg border">
              <Image
                src={collectionItem.jersey.imageUrl}
                alt={collectionItem.jersey.name}
                fill
                className="object-contain rounded-lg"
              />
            </div>

            {/* Badges principaux */}
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
            </div>
          </div>

          <div className="space-y-6">
            {/* Infos du maillot */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
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

            {/* Infos collection */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Votre maillot
              </h4>

              <div className="space-y-3 text-sm">
                {collectionItem.purchasePrice && (
                  <div className="flex items-center gap-2">
                    <Euro className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Prix d&apos;achat :
                    </span>
                    <span className="font-semibold text-primary">
                      {collectionItem.purchasePrice}€
                    </span>
                  </div>
                )}

                {collectionItem.purchaseDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Acheté le :</span>
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Personnalisation :
                      </span>
                    </div>
                    <div className="ml-6 space-y-1 text-sm">
                      {(() => {
                        const parts =
                          collectionItem.personalization!.split(" ");
                        if (parts.length >= 2) {
                          const number = parts[parts.length - 1];
                          const playerName = parts.slice(0, -1).join(" ");

                          if (/^\d+$/.test(number)) {
                            return (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Joueur :
                                  </span>
                                  <span className="font-medium">
                                    {playerName}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Numéro :
                                  </span>
                                  <span className="font-medium">{number}</span>
                                </div>
                              </>
                            );
                          }
                        }

                        return (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Texte :
                            </span>
                            <span className="font-medium">
                              {collectionItem.personalization}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Ajouté le :</span>
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

            {collectionItem.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes personnelles
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {collectionItem.notes}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1 cursor-pointer"
            onClick={onClose}
          >
            Fermer
          </Button>
          {/* <Button variant="outline" className="flex-1">
            Modifier
          </Button>
          <Button variant="destructive" className="flex-1">
            Supprimer
          </Button> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
