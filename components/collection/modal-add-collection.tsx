"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
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
  BadgeCheck,
  Camera,
  FileText,
  ShoppingBag,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";
import type {
  AddToCollectionData,
  Condition,
  JerseyVersion,
  Size,
  UpdateCollectionData,
} from "@/types/collection";
import type { JerseyHeaderJersey } from "./jersey-modal/jersey-header";
import { JerseyHeader } from "./jersey-modal/jersey-header";
import { InfoCard } from "./jersey-modal/info-card";
import { MyJerseyEditForm } from "./jersey-modal/forms/my-jersey-edit-form";
import { AcquisitionEditForm } from "./jersey-modal/forms/acquisition-edit-form";
import { AuthenticationEditForm } from "./jersey-modal/forms/authentication-edit-form";

export type AddToCollectionJersey = JerseyHeaderJersey & {
  id: string;
  imageUrl: string;
};

interface AddToCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddToCollectionData) => Promise<void>;
  isLoading: boolean;
  jersey: AddToCollectionJersey;
}

const VERSIONS_WITH_MATCH_INFO: JerseyVersion[] = [
  "PLAYER_ISSUE",
  "MATCH_WORN",
];

function getAccent(
  version: string | null | undefined
): "violet" | "amber" | undefined {
  if (version === "MATCH_WORN") return "amber";
  if (version === "PLAYER_ISSUE") return "violet";
  return undefined;
}

function shouldShowAuthCard(formData: UpdateCollectionData): boolean {
  if (formData.isSigned) return true;
  if (formData.hasAuthCertificate) return true;
  if (VERSIONS_WITH_MATCH_INFO.includes(formData.version as JerseyVersion))
    return true;
  return false;
}

const INITIAL_FORM: UpdateCollectionData = {
  version: "REPLICA" as JerseyVersion,
  size: "M" as Size,
  condition: "MINT" as Condition,
  hasTags: false,
  isGift: false,
  isFromMysteryBox: false,
  isSigned: false,
  hasAuthCertificate: false,
  certificateUrl: undefined,
  hasLongSleeves: false,
  patches: [],
};

export function AddToCollectionModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  jersey,
}: AddToCollectionModalProps) {
  const t = useTranslations("Collection.modal.add");
  const tView = useTranslations("Collection.modal.view");

  const [formData, setFormData] = useState<UpdateCollectionData>(INITIAL_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData({ ...formData, userPhotoUrl: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.condition) {
      toast.error(t("toast.conditionRequired"));
      return;
    }

    const dataToSubmit: AddToCollectionData = {
      ...formData,
      size: formData.size,
      condition: formData.condition,
      isGift: formData.isGift,
      isFromMysteryBox: formData.isFromMysteryBox,
    };

    if (photoFile) {
      setIsUploadingPhoto(true);
      try {
        const uploadFormData = new FormData();
        uploadFormData.append("file", photoFile);
        uploadFormData.append("userJerseyId", "temp-" + Date.now());

        const response = await fetch("/api/user/jersey-photo/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erreur lors de l'upload");
        }

        const { path } = await response.json();
        dataToSubmit.userPhotoUrl = path;
      } catch (error) {
        console.error("Erreur upload photo:", error);
        toast.error(t("toast.uploadError"));
        setIsUploadingPhoto(false);
        return;
      } finally {
        setIsUploadingPhoto(false);
      }
    }

    await onSubmit(dataToSubmit);
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) handleReset();
    onOpenChange(newOpen);
  };

  const showAuthCard = shouldShowAuthCard(formData);
  const hasUserPhoto = !!photoPreview;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-6xl max-h-[90vh] flex flex-col p-0 @container">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <form
          id="add-collection-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6 @xl:pt-8"
        >
          <div className="grid grid-cols-1 @xl:grid-cols-[380px_1fr] @4xl:grid-cols-[440px_1fr] gap-5 @4xl:gap-6 items-stretch">
            {/* Colonne gauche : photo officielle + dropzone photo perso */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl bg-[#FAF5EE] p-4 @xl:p-6 flex-1 flex items-center justify-center min-h-[280px] @xl:min-h-[420px]">
                <div className="relative w-full aspect-square">
                  <Image
                    src={jersey.imageUrl}
                    alt={jersey.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>

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
                {photoPreview && (
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted border">
                    <Image
                      src={photoPreview}
                      alt={t("photoYourPhoto")}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("photoFormats")}
                </p>
              </div>
            </div>

            {/* Colonne droite : header + cards */}
            <div className="space-y-4">
              <JerseyHeader jersey={jersey} />

              <InfoCard icon={User} title={tView("cards.myJersey")}>
                <MyJerseyEditForm
                  jerseyId={jersey.id}
                  formData={formData}
                  setFormData={setFormData}
                />
              </InfoCard>

              <InfoCard
                icon={ShoppingBag}
                title={tView("cards.acquisition")}
              >
                <AcquisitionEditForm
                  formData={formData}
                  setFormData={setFormData}
                />
              </InfoCard>

              {showAuthCard && (
                <InfoCard
                  icon={BadgeCheck}
                  title={tView("cards.authentication")}
                  accent={getAccent(formData.version)}
                >
                  <AuthenticationEditForm
                    formData={formData}
                    setFormData={setFormData}
                  />
                </InfoCard>
              )}

              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {tView("personalNotes")}
                  </h4>
                </div>
                <Textarea
                  id="notes"
                  placeholder={t("notesPlaceholder")}
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className="px-6 py-4 border-t flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 cursor-pointer"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading || isUploadingPhoto}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="add-collection-form"
            disabled={isLoading || isUploadingPhoto}
            className="flex-1 cursor-pointer"
          >
            {isUploadingPhoto ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                <span>{t("uploadPhoto")}</span>
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                <span>{t("adding")}</span>
              </div>
            ) : (
              <span>{t("addToCollection")}</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
