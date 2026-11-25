"use client";

import { Fragment, useState } from "react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UpdateCollectionData } from "@/types/collection";
import { useUserCurrency } from "@/hooks/useUserCurrency";
import { CurrencySelect } from "./currency-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PURCHASE_SOURCES } from "@/lib/collection-item-rules";

/** Valeur interne du choix « aucun lieu » (Radix Select n'accepte pas une valeur vide). */
const NO_SOURCE = "__none";

interface AcquisitionEditFormProps {
  formData: UpdateCollectionData;
  setFormData: (data: UpdateCollectionData) => void;
}

export function AcquisitionEditForm({
  formData,
  setFormData,
}: AcquisitionEditFormProps) {
  const t = useTranslations("Collection.modal.view");
  const { suggested } = useUserCurrency();
  // Devise de l'item si un prix existe déjà, sinon préférence du user ou pays.
  const currency = formData.purchaseCurrency ?? suggested;
  // Date locale du jour (pas toISOString, qui donnerait la date UTC) : borne le
  // sélecteur, le serveur refuse de toute façon une date d'achat future.
  const [today] = useState(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="purchasePrice">{t("purchasePrice")}</Label>
          <div className="flex gap-2">
            <Input
              id="purchasePrice"
              type="number"
              step="0.01"
              min="0"
              className="min-w-0 flex-1"
              placeholder={t("purchasePricePlaceholder")}
              value={formData.purchasePrice ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  purchasePrice: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                  purchaseCurrency: currency,
                })
              }
            />
            <CurrencySelect
              value={currency}
              ariaLabel={t("purchaseCurrency")}
              className="w-[5.5rem] shrink-0"
              onChange={(next) => setFormData({ ...formData, purchaseCurrency: next })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="purchaseDate">{t("purchaseDate")}</Label>
          <Input
            id="purchaseDate"
            type="date"
            max={today}
            value={
              formData.purchaseDate
                ? formData.purchaseDate instanceof Date
                  ? formData.purchaseDate.toISOString().split("T")[0]
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
      </div>

      {/* Lieu d'achat, facultatif sans le dire : source « achats des membres » de la cote. */}
      <div className="space-y-1.5">
        <Label htmlFor="purchaseSource">{t("purchaseSource")}</Label>
        <Select
          value={formData.purchaseSource ?? NO_SOURCE}
          onValueChange={(v) =>
            setFormData({ ...formData, purchaseSource: v === NO_SOURCE ? undefined : v })
          }
        >
          <SelectTrigger id="purchaseSource" className="cursor-pointer">
            <SelectValue placeholder={t("purchaseSourcePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_SOURCE} className="cursor-pointer text-muted-foreground">
              {t("purchaseSourceNone")}
            </SelectItem>
            {PURCHASE_SOURCES.map((source, i) => (
              <Fragment key={source}>
                {/* Séparateurs : prix public | revente | autre */}
                {(i === 2 || i === PURCHASE_SOURCES.length - 1) && <SelectSeparator />}
                <SelectItem value={source} className="cursor-pointer">
                  {t(`purchaseSources.${source}`)}
                </SelectItem>
              </Fragment>
            ))}
          </SelectContent>
        </Select>
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
  );
}
