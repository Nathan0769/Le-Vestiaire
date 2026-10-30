"use client";

import { useLocale, useTranslations } from "next-intl";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import { formatMoney } from "@/lib/format-money";
import { ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { InfoCard } from "./info-card";
import { AcquisitionEditForm } from "./forms/acquisition-edit-form";
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
  const locale = useLocale();

  if (isEditing && formData && setFormData) {
    return (
      <InfoCard icon={ShoppingBag} title={t("cards.acquisition")}>
        <AcquisitionEditForm formData={formData} setFormData={setFormData} />
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
              {formatMoney(
                collectionItem.purchasePrice,
                collectionItem.purchaseCurrency ?? DEFAULT_CURRENCY,
                locale
              )}
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
