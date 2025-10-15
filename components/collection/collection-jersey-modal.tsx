"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Euro,
  FileText,
  Tag,
  User,
  Package,
  Star,
  Edit3,
  Trash2,
  Save,
  X,
  Gift,
  Camera,
  Upload,
} from "lucide-react";
import { CONDITION_LABELS, SIZE_LABELS } from "@/types/collection";
import type { Size, Condition, UpdateCollectionData } from "@/types/collection";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import type { CollectionItemWithJersey } from "@/types/collection-page";
import { ImageCarousel } from "./image-carousel";

interface CollectionJerseyModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionItem: CollectionItemWithJersey;
  onUpdate?: (updatedItem: CollectionItemWithJersey) => void;
  onDelete?: (deletedItemId: string) => void;
}

export function CollectionJerseyModal({
  isOpen,
  onClose,
  collectionItem,
  onUpdate,
  onDelete,
}: CollectionJerseyModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState<UpdateCollectionData>({
    size: (collectionItem.size || "M") as Size,
    condition: collectionItem.condition as Condition,
    hasTags: collectionItem.hasTags,
    personalization: collectionItem.personalization || "",
    purchasePrice: collectionItem.purchasePrice || undefined,
    purchaseDate: collectionItem.purchaseDate || undefined,
    notes: collectionItem.notes || "",
    isGift: collectionItem.isGift || false,
    isFromMysteryBox: collectionItem.isFromMysteryBox || false,
    userPhotoUrl: collectionItem.userPhotoUrl || undefined,
  });

  const resetForm = () => {
    setFormData({
      size: (collectionItem.size || "M") as Size,
      condition: collectionItem.condition as Condition,
      hasTags: collectionItem.hasTags,
      personalization: collectionItem.personalization || "",
      purchasePrice: collectionItem.purchasePrice || undefined,
      purchaseDate: collectionItem.purchaseDate || undefined,
      notes: collectionItem.notes || "",
      isGift: collectionItem.isGift || false,
      isFromMysteryBox: collectionItem.isFromMysteryBox || false,
      userPhotoUrl: collectionItem.userPhotoUrl || undefined,
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    resetForm();
  };

  const handleCancel = () => {
    setIsEditing(false);
    resetForm();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La photo ne doit pas dépasser 5MB");
      return;
    }

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData({ ...formData, userPhotoUrl: undefined });
  };

  const handleSave = async () => {
    if (!formData.size || !formData.condition) {
      toast.error("La taille et l'état sont obligatoires");
      return;
    }

    setIsLoading(true);

    const dataToSave = { ...formData };

    if (photoFile) {
      setIsUploadingPhoto(true);
      try {
        const uploadFormData = new FormData();
        uploadFormData.append("file", photoFile);
        uploadFormData.append("userJerseyId", collectionItem.id);

        const response = await fetch("/api/user/jersey-photo/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erreur lors de l'upload");
        }

        const { path } = await response.json();
        dataToSave.userPhotoUrl = path;
      } catch (error) {
        console.error("Erreur upload photo:", error);
        toast.error("Erreur lors de l'upload de la photo");
        setIsUploadingPhoto(false);
        setIsLoading(false);
        return;
      } finally {
        setIsUploadingPhoto(false);
      }
    }

    try {
      const response = await fetch(
        `/api/jerseys/${collectionItem.jerseyId}/collection`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...dataToSave,
            purchasePrice: dataToSave.purchasePrice || null,
            purchaseDate: dataToSave.purchaseDate || null,
            personalization: dataToSave.personalization || null,
            notes: dataToSave.notes || null,
            userPhotoUrl: dataToSave.userPhotoUrl || null,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setIsEditing(false);
        toast.success("Maillot mis à jour avec succès");

        if (onUpdate && result.userJersey) {
          onUpdate(result.userJersey);
        }
      } else {
        toast.error(result.error || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/jerseys/${collectionItem.jerseyId}/collection`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Maillot supprimé de votre collection");
        setShowDeleteDialog(false);
        onClose();

        if (onDelete) {
          onDelete(collectionItem.id);
        }
      } else {
        toast.error(result.error || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
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

  const carouselImages = [];

  if (photoPreview) {
    carouselImages.push({
      src: photoPreview,
      alt: "Votre photo",
      label: "Votre photo",
    });
  } else if (collectionItem.userPhotoUrl) {
    carouselImages.push({
      src: collectionItem.userPhotoUrl,
      alt: "Votre photo",
      label: "Votre photo",
    });
  }

  carouselImages.push({
    src: collectionItem.jersey.imageUrl,
    alt: collectionItem.jersey.name,
    label: "Photo officielle",
  });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {isEditing
                ? "Modifier votre maillot"
                : "Détails de votre maillot"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <ImageCarousel images={carouselImages} />

              {isEditing && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    {collectionItem.userPhotoUrl || photoPreview
                      ? "Modifier votre photo"
                      : "Ajouter votre photo"}
                  </Label>
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full cursor-pointer"
                        asChild
                      >
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Choisir une photo
                        </span>
                      </Button>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                    </label>
                    {(collectionItem.userPhotoUrl || photoPreview) && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleRemovePhoto}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP (Max 5MB)
                  </p>
                </div>
              )}

              {!isEditing && (
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
                    <Badge variant="outline">
                      Taille {collectionItem.size}
                    </Badge>
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
              )}
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
                  Votre maillot
                </h4>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="size"
                          className="flex items-center gap-1"
                        >
                          Taille <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.size}
                          onValueChange={(value: Size) =>
                            setFormData({ ...formData, size: value })
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(SIZE_LABELS).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="condition"
                          className="flex items-center gap-1"
                        >
                          État <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.condition}
                          onValueChange={(value: Condition) =>
                            setFormData({ ...formData, condition: value })
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CONDITION_LABELS).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purchasePrice">
                        Prix d&apos;achat (€)
                      </Label>
                      <Input
                        id="purchasePrice"
                        type="number"
                        step="1"
                        min="0"
                        placeholder="Ex: 90"
                        value={formData.purchasePrice || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            purchasePrice: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purchaseDate">Date d&apos;achat</Label>
                      <Input
                        id="purchaseDate"
                        type="date"
                        value={
                          formData.purchaseDate
                            ? formData.purchaseDate instanceof Date
                              ? formData.purchaseDate
                                  .toISOString()
                                  .split("T")[0]
                              : new Date(formData.purchaseDate)
                                  .toISOString()
                                  .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            purchaseDate: e.target.value
                              ? new Date(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="personalization">
                        Personnalisation (nom, numéro...)
                      </Label>
                      <Input
                        id="personalization"
                        placeholder="Ex: MESSI 10"
                        value={formData.personalization || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            personalization: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasTags"
                        checked={formData.hasTags}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, hasTags: !!checked })
                        }
                      />
                      <Label htmlFor="hasTags">
                        Possède encore les étiquettes
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isGift"
                        checked={formData.isGift}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isGift: !!checked })
                        }
                      />
                      <Label
                        htmlFor="isGift"
                        className="flex items-center gap-2"
                      >
                        Ce maillot est un cadeau
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isFromMysteryBox"
                        checked={formData.isFromMysteryBox}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            isFromMysteryBox: !!checked,
                          })
                        }
                      />
                      <Label
                        htmlFor="isFromMysteryBox"
                        className="flex items-center gap-2"
                      >
                        Maillot reçu dans une box mystère
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes personnelles</Label>
                      <Textarea
                        id="notes"
                        placeholder="Ajoutez vos commentaires sur ce maillot..."
                        value={formData.notes || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
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
                        <span className="text-muted-foreground">
                          Acheté le :
                        </span>
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
                                      <span className="font-medium">
                                        {number}
                                      </span>
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
                )}
              </div>

              {!isEditing && collectionItem.notes && (
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
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading || isUploadingPhoto}
                  className="flex-1 cursor-pointer"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading || isUploadingPhoto}
                  className="flex-1 cursor-pointer"
                >
                  {isUploadingPhoto ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                      <span>Upload...</span>
                    </div>
                  ) : isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                      <span>Sauvegarde...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      <span>Sauvegarder</span>
                    </div>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 cursor-pointer"
                >
                  Fermer
                </Button>
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  className="flex-1 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le maillot ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce maillot de votre collection
              ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} className="cursor-pointer">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  <span>Suppression...</span>
                </div>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
