"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Camera,
  Edit3,
  FileText,
  Package,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type {
  Condition,
  JerseyVersion,
  Size,
  UpdateCollectionData,
} from "@/types/collection";
import { toast } from "sonner";
import type { CollectionItemWithJersey } from "@/types/collection-page";
import { ImageCarousel } from "./image-carousel";
import { BadgesSummary } from "./jersey-modal/badges-summary";
import { JerseyHeader } from "./jersey-modal/jersey-header";
import { MyJerseyCard } from "./jersey-modal/my-jersey-card";
import { AcquisitionCard } from "./jersey-modal/acquisition-card";
import { AuthenticationCard } from "./jersey-modal/authentication-card";

interface CollectionJerseyModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionItem: CollectionItemWithJersey;
  onUpdate?: (updatedItem: CollectionItemWithJersey) => void;
  onDelete?: (deletedItemId: string) => void;
}

const VERSIONS_WITH_MATCH_INFO: JerseyVersion[] = [
  "PLAYER_ISSUE",
  "MATCH_WORN",
];

function shouldShowAuthCard(item: CollectionItemWithJersey): boolean {
  if (item.isSigned) return true;
  if (item.hasAuthCertificate) return true;
  if (item.matchDescription || item.matchDate) return true;
  if (VERSIONS_WITH_MATCH_INFO.includes(item.version as JerseyVersion))
    return true;
  return false;
}

export function CollectionJerseyModal({
  isOpen,
  onClose,
  collectionItem,
  onUpdate,
  onDelete,
}: CollectionJerseyModalProps) {
  const t = useTranslations("Collection.modal.view");
  const tDelete = useTranslations("Collection.modal.delete");

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoDeleted, setPhotoDeleted] = useState(false);

  const buildInitialFormData = (): UpdateCollectionData => ({
    version: (collectionItem.version || "REPLICA") as JerseyVersion,
    size: (collectionItem.size || "M") as Size,
    condition: collectionItem.condition as Condition,
    hasTags: collectionItem.hasTags,
    playerName: collectionItem.playerName || "",
    playerNumber: collectionItem.playerNumber ?? undefined,
    purchasePrice: collectionItem.purchasePrice || undefined,
    purchaseDate: collectionItem.purchaseDate || undefined,
    notes: collectionItem.notes || "",
    isGift: collectionItem.isGift || false,
    isFromMysteryBox: collectionItem.isFromMysteryBox || false,
    userPhotoUrl: collectionItem.userPhotoUrl || undefined,
    isSigned: collectionItem.isSigned || false,
    signedBy: collectionItem.signedBy || "",
    hasAuthCertificate: collectionItem.hasAuthCertificate || false,
    certificateUrl: collectionItem.certificateUrl || "",
    matchDescription: collectionItem.matchDescription || "",
    matchDate: collectionItem.matchDate || undefined,
    hasLongSleeves: collectionItem.hasLongSleeves || false,
    patches: (collectionItem.patches ?? []).map((p) => ({
      patchId: p.patchId ?? undefined,
      customLabel: p.customLabel ?? undefined,
    })),
  });

  const [formData, setFormData] = useState<UpdateCollectionData>(
    buildInitialFormData()
  );

  const resetForm = () => {
    setFormData(buildInitialFormData());
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoDeleted(false);
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
      toast.error(t("toast.fileNotImage"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("toast.fileTooLarge"));
      return;
    }

    setPhotoFile(file);
    setPhotoDeleted(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoDeleted(true);
    setFormData({ ...formData, userPhotoUrl: undefined });
  };

  const handleSave = async () => {
    if (!formData.size || !formData.condition) {
      toast.error(t("toast.sizeConditionRequired"));
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
        toast.error(t("toast.uploadError"));
        setIsUploadingPhoto(false);
        setIsLoading(false);
        return;
      } finally {
        setIsUploadingPhoto(false);
      }
    }

    try {
      const payload: Record<string, unknown> = {
        version: dataToSave.version,
        size: dataToSave.size,
        condition: dataToSave.condition,
        hasTags: dataToSave.hasTags ?? false,
        playerName: dataToSave.playerName || null,
        playerNumber: dataToSave.playerNumber ?? null,
        purchasePrice: dataToSave.purchasePrice || null,
        purchaseDate: dataToSave.purchaseDate || null,
        notes: dataToSave.notes || null,
        isGift: dataToSave.isGift ?? false,
        isFromMysteryBox: dataToSave.isFromMysteryBox ?? false,
        isSigned: dataToSave.isSigned ?? false,
        signedBy: dataToSave.isSigned ? dataToSave.signedBy || null : null,
        hasAuthCertificate: dataToSave.hasAuthCertificate ?? false,
        matchDescription: dataToSave.matchDescription || null,
        matchDate: dataToSave.matchDate || null,
        hasLongSleeves: dataToSave.hasLongSleeves ?? false,
        patches: dataToSave.patches ?? [],
      };

      if (photoFile) {
        payload.userPhotoUrl = dataToSave.userPhotoUrl;
      } else if (
        dataToSave.userPhotoUrl === undefined &&
        collectionItem.userPhotoUrl
      ) {
        payload.userPhotoUrl = null;
      }

      const response = await fetch(`/api/user-jerseys/${collectionItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsEditing(false);
        toast.success(t("toast.updated"));
        if (onUpdate && result.userJersey) {
          onUpdate(result.userJersey);
        }
      } else {
        toast.error(result.error || t("toast.error"));
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error(t("toast.connectionError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user-jerseys/${collectionItem.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(t("toast.deleted"));
        setShowDeleteDialog(false);
        onClose();
        if (onDelete) {
          onDelete(collectionItem.id);
        }
      } else {
        toast.error(result.error || t("toast.error"));
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error(t("toast.connectionError"));
    } finally {
      setIsLoading(false);
    }
  };

  const carouselImages: { src: string; alt: string; label: string }[] = [];

  if (photoPreview) {
    carouselImages.push({
      src: photoPreview,
      alt: t("yourPhoto"),
      label: t("yourPhoto"),
    });
  } else if (collectionItem.userPhotoUrl && !photoDeleted) {
    carouselImages.push({
      src: collectionItem.userPhotoUrl,
      alt: t("yourPhoto"),
      label: t("yourPhoto"),
    });
  }

  carouselImages.push({
    src: collectionItem.jersey.imageUrl,
    alt: collectionItem.jersey.name,
    label: t("officialPhoto"),
  });

  const showAuthCard = isEditing || shouldShowAuthCard(collectionItem);
  const showNotes = isEditing || !!collectionItem.notes;
  const hasUserPhoto =
    (collectionItem.userPhotoUrl && !photoDeleted) || photoPreview;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] sm:max-w-6xl max-h-[90vh] flex flex-col p-0 @container">
          {isEditing ? (
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                {t("titleEdit")}
              </DialogTitle>
            </DialogHeader>
          ) : (
            <DialogHeader className="sr-only">
              <DialogTitle>{t("titleView")}</DialogTitle>
            </DialogHeader>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-6 @xl:pt-8">
            <div className="grid grid-cols-1 @xl:grid-cols-[380px_1fr] @4xl:grid-cols-[440px_1fr] gap-5 @4xl:gap-6 items-stretch">
              {/* Colonne gauche : photo dans un cadre coloré, centrée verticalement */}
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl bg-[#FAF5EE] p-4 @xl:p-6 flex-1 flex items-center justify-center min-h-[420px]">
                  <div className="w-full">
                    <ImageCarousel images={carouselImages} />
                  </div>
                </div>

                {isEditing && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Camera className="w-4 h-4" />
                      {hasUserPhoto ? t("modifyPhoto") : t("addPhoto")}
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
                            {t("choosePhoto")}
                          </span>
                        </Button>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handlePhotoChange}
                        />
                      </label>
                      {hasUserPhoto && (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleRemovePhoto}
                          className="cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("photoFormats")}
                    </p>
                  </div>
                )}
              </div>

              {/* Colonne droite : header + cards empilées verticalement */}
              <div className="space-y-4">
                <JerseyHeader collectionItem={collectionItem} />

                {!isEditing && <BadgesSummary collectionItem={collectionItem} />}

                <MyJerseyCard
                  collectionItem={collectionItem}
                  isEditing={isEditing}
                  formData={formData}
                  setFormData={setFormData}
                />

                <AcquisitionCard
                  collectionItem={collectionItem}
                  isEditing={isEditing}
                  formData={formData}
                  setFormData={setFormData}
                />

                {showAuthCard && (
                  <AuthenticationCard
                    collectionItem={collectionItem}
                    isEditing={isEditing}
                    formData={formData}
                    setFormData={setFormData}
                  />
                )}

                {showNotes && (
                  <div className="rounded-xl border bg-card p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("personalNotes")}
                      </h4>
                    </div>
                    {isEditing ? (
                      <Textarea
                        id="notes"
                        placeholder={t("notesPlaceholder")}
                        value={formData.notes || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                        {collectionItem.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t flex-row gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading || isUploadingPhoto}
                  className="flex-1 cursor-pointer"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t("cancel")}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading || isUploadingPhoto}
                  className="flex-1 cursor-pointer"
                >
                  {isUploadingPhoto ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                      <span>{t("uploading")}</span>
                    </div>
                  ) : isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                      <span>{t("saving")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      <span>{t("save")}</span>
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
                  {t("close")}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  className="flex-1 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  {t("edit")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tDelete("title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tDelete("description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} className="cursor-pointer">
              {tDelete("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  <span>{tDelete("deleting")}</span>
                </div>
              ) : (
                tDelete("confirm")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
