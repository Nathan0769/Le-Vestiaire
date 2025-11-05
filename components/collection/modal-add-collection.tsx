"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { Camera, X } from "lucide-react";
import Image from "next/image";
import type { Size, Condition, AddToCollectionData } from "@/types/collection";
import { SIZE_LABELS } from "@/types/collection";

interface AddToCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddToCollectionData) => Promise<void>;
  isLoading: boolean;
}

export function AddToCollectionModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: AddToCollectionModalProps) {
  const t = useTranslations("Collection.modal.add");
  const tCondition = useTranslations("Condition");
  const [formData, setFormData] = useState<AddToCollectionData>({
    size: "M" as Size,
    condition: "MINT" as Condition,
    hasTags: false,
    isGift: false,
    isFromMysteryBox: false,
  });

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

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("toast.fileTooLarge"));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.size) {
      toast.error(t("toast.sizeRequired"));
      return;
    }

    if (!formData.condition) {
      toast.error(t("toast.conditionRequired"));
      return;
    }

    const dataToSubmit = { ...formData };

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
    setFormData({
      size: "M" as Size,
      condition: "MINT" as Condition,
      hasTags: false,
      isGift: false,
      isFromMysteryBox: false,
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleReset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90dvh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            id="collection-form"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size" className="flex items-center gap-1">
                  {t("size")} <span className="text-destructive">{t("sizeRequired")}</span>
                </Label>
                <Select
                  value={formData.size}
                  onValueChange={(value: Size) =>
                    setFormData({ ...formData, size: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("sizePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SIZE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition" className="flex items-center gap-1">
                  {t("condition")} <span className="text-destructive">{t("conditionRequired")}</span>
                </Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value: Condition) =>
                    setFormData({ ...formData, condition: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("conditionPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(["MINT", "EXCELLENT", "GOOD", "FAIR", "POOR"] as const).map((value) => (
                      <SelectItem key={value} value={value}>
                        {tCondition(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">{t("purchasePrice")}</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.1"
                min="0"
                placeholder={t("purchasePricePlaceholder")}
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
              <Label htmlFor="purchaseDate">{t("purchaseDate")}</Label>
              <Input
                id="purchaseDate"
                type="date"
                className="h-9 text-base [&::-webkit-date-and-time-value]:text-base [&::-webkit-datetime-edit]:text-base [&::-webkit-datetime-edit-fields-wrapper]:text-base [&::-webkit-calendar-picker-indicator]:opacity-100"
                value={
                  formData.purchaseDate
                    ? formData.purchaseDate.toISOString().split("T")[0]
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
                {t("personalization")}
              </Label>
              <Input
                id="personalization"
                placeholder={t("personalizationPlaceholder")}
                value={formData.personalization || ""}
                onChange={(e) =>
                  setFormData({ ...formData, personalization: e.target.value })
                }
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasTags"
                  checked={formData.hasTags}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, hasTags: !!checked })
                  }
                />
                <Label htmlFor="hasTags">{t("hasTags")}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isGift"
                  checked={formData.isGift}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isGift: !!checked })
                  }
                />
                <Label htmlFor="isGift">{t("isGift")}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFromMysteryBox"
                  checked={formData.isFromMysteryBox}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isFromMysteryBox: !!checked })
                  }
                />
                <Label htmlFor="isFromMysteryBox">
                  {t("isFromMysteryBox")}
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t("notes")}</Label>
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
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                {t("photo")}
              </Label>

              {photoPreview ? (
                <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={photoPreview}
                    alt="Aperçu"
                    fill
                    className="object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleRemovePhoto}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Camera className="w-12 h-12 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">
                        {t("photoClickToAdd")}
                      </span>{" "}
                      {t("photoYourPhoto")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("photoFormats")}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </label>
              )}
            </div>
          </form>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading || isUploadingPhoto}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="collection-form"
            disabled={isLoading || isUploadingPhoto}
            className="cursor-pointer"
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
