"use client";

import { useTranslations } from "next-intl";
import { ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { InfoCard } from "./info-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CollectionItemWithJersey } from "@/types/collection-page";
import type { UpdateCollectionData } from "@/types/collection";

interface AcquisitionCardProps {
  collectionItem: CollectionItemWithJersey;
  isEditing?: boolean;
  formData?: UpdateCollectionData;
  setFormData?: (data: UpdateCollectionData) => void;
}

export function AcquisitionCard({
  collectionItem,
  isEditing = false,
  formData,
  setFormData,
}: AcquisitionCardProps) {
  const t = useTranslations("Collection.modal.view");

  if (isEditing && formData && setFormData) {
    return (
      <InfoCard icon={ShoppingBag} title={t("cards.acquisition")}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="purchasePrice">{t("purchasePrice")}</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                min="0"
                placeholder={t("purchasePricePlaceholder")}
                value={formData.purchasePrice ?? ""}
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
            <div className="space-y-1.5">
              <Label htmlFor="purchaseDate">{t("purchaseDate")}</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={
                  formData.purchaseDate
                    ? formData.purchaseDate instanceof Date
                      ? formData.purchaseDate.toISOString().split("T")[0]
                      : new Date(formData.purchaseDate).toISOString().split("T")[0]
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
          </div>

          <div className="space-y-2 pt-1">
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
              <Label htmlFor="isFromMysteryBox">{t("isFromMysteryBox")}</Label>
            </div>
          </div>
        </div>
      </InfoCard>
    );
  }

  return (
    <InfoCard icon={ShoppingBag} title={t("cards.acquisition")}>
      {collectionItem.purchasePrice && (
        <Row
          label={t("purchasePrice")}
          value={
            <span className="font-semibold text-primary">
              {collectionItem.purchasePrice}€
            </span>
          }
        />
      )}

      {collectionItem.purchaseDate && (
        <Row
          label={t("purchasedOn")}
          value={format(
            new Date(collectionItem.purchaseDate),
            "dd MMMM yyyy",
            { locale: fr }
          )}
        />
      )}

      <Row
        label={t("addedOn")}
        value={format(new Date(collectionItem.createdAt), "dd MMMM yyyy", {
          locale: fr,
        })}
      />
    </InfoCard>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
