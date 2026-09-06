"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MAX_USER_JERSEY_PHOTOS } from "@/lib/user-jersey-photos";
import { convertHeicToJpeg } from "@/lib/heic-to-jpeg";
import { compressImage } from "@/lib/compress-image";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/**
 * Une photo perso en cours d'edition : soit deja stockee (path R2 connu + URL
 * signee pour l'apercu), soit un nouveau fichier a uploader (apercu data URL).
 */
export type PhotoSlot =
  | { kind: "existing"; path: string; url: string }
  | { kind: "new"; file: File; preview: string };

type PhotoSlotsProps = {
  slots: PhotoSlot[];
  onChange: (slots: PhotoSlot[]) => void;
  /** Namespace i18n fournissant addPhoto, choosePhoto, photoFormats, photoYourPhoto, toast.* */
  namespace: "Collection.modal.add" | "Collection.modal.view";
  /** Plafond de photos (dépend du tier Supporter). */
  max?: number;
};

export function PhotoSlots({
  slots,
  onChange,
  namespace,
  max = MAX_USER_JERSEY_PHOTOS,
}: PhotoSlotsProps) {
  const t = useTranslations(namespace);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isConverting, setIsConverting] = useState(false);

  const canAdd = slots.length < max;

  const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset pour pouvoir re-selectionner le meme fichier apres suppression.
    e.target.value = "";
    if (!file) return;

    // Le HEIC (photos iOS) a souvent un file.type vide : on tolere aussi
    // l'extension, la conversion le transformera en JPEG juste apres.
    const isHeicByName = /\.(heic|heif)$/i.test(file.name);
    if (!file.type.startsWith("image/") && !isHeicByName) {
      toast.error(t("toast.fileNotImage"));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(t("toast.fileTooLarge"));
      return;
    }
    if (slots.length >= max) {
      toast.error(t("toast.photoLimit", { max }));
      return;
    }

    let workingFile: File;
    try {
      setIsConverting(true);
      // HEIC (iOS) -> JPEG, puis compression/downscale pour rester sous la
      // limite Vercel (~4.5MB de corps de requete serverless).
      const jpeg = await convertHeicToJpeg(file);
      workingFile = await compressImage(jpeg);
    } catch (err) {
      console.error("Erreur preparation photo:", err);
      toast.error(t("toast.conversionError"));
      return;
    } finally {
      setIsConverting(false);
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onChange([
        ...slots,
        { kind: "new", file: workingFile, preview: reader.result as string },
      ]);
    };
    reader.readAsDataURL(workingFile);
  };

  const handleRemove = (index: number) => {
    onChange(slots.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm">
        <Camera className="w-4 h-4" />
        {t("addPhoto")}
        <span className="text-xs text-muted-foreground font-normal">
          {slots.length}/{max}
        </span>
      </Label>

      {canAdd && (
        <label className="block">
          <Button
            type="button"
            variant="outline"
            className="w-full cursor-pointer"
            disabled={isConverting}
            asChild
          >
            <span>
              {isConverting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isConverting ? t("photoConverting") : t("choosePhoto")}
            </span>
          </Button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*,.heic,.heif"
            disabled={isConverting}
            onChange={handleAdd}
          />
        </label>
      )}

      {slots.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {slots.map((slot, index) => (
            <div
              key={slot.kind === "existing" ? slot.path : `new-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted border"
            >
              <Image
                src={slot.kind === "new" ? slot.preview : slot.url}
                alt={t("photoYourPhoto")}
                fill
                className="object-contain"
                unoptimized
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 h-7 w-7 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("photoFormats")}</p>
    </div>
  );
}

/**
 * Erreur d'upload portant un message serveur fiable (deja en francais).
 * Permet aux appelants de distinguer une erreur metier (a afficher tel quel)
 * d'une erreur reseau/inconnue (fallback generique).
 */
export class PhotoUploadError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "PhotoUploadError";
  }
}

/**
 * Upload les nouveaux fichiers dans l'ordre des slots et retourne les paths R2
 * ordonnes (les slots existants conservent leur path). A soumettre en userPhotoUrls.
 */
export async function uploadPhotoSlots(
  slots: PhotoSlot[],
  userJerseyId: string
): Promise<string[]> {
  const paths: string[] = [];
  for (const slot of slots) {
    if (slot.kind === "existing") {
      paths.push(slot.path);
      continue;
    }
    const formData = new FormData();
    formData.append("file", slot.file);
    formData.append("userJerseyId", userJerseyId);

    const response = await fetch("/api/user/jersey-photo/upload", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new PhotoUploadError(
        data?.error || "Erreur lors de l'upload de la photo",
        response.status
      );
    }
    const { path } = await response.json();
    paths.push(path);
  }
  return paths;
}
