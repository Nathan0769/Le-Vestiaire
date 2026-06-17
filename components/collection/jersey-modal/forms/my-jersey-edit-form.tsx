"use client";

import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PatchesSection } from "@/components/collection/patches-section";
import { SIZE_LABELS } from "@/types/collection";
import type {
  Condition,
  JerseyVersion,
  Size,
  UpdateCollectionData,
} from "@/types/collection";
import type { UserJerseyPatchInput } from "@/types/patch";

const VERSION_ORDER: JerseyVersion[] = [
  "REPLICA",
  "AUTHENTIC",
  "STOCK_PRO",
  "PLAYER_ISSUE",
  "MATCH_WORN",
];

interface MyJerseyEditFormProps {
  jerseyId: string;
  formData: UpdateCollectionData;
  setFormData: (data: UpdateCollectionData) => void;
}

export function MyJerseyEditForm({
  jerseyId,
  formData,
  setFormData,
}: MyJerseyEditFormProps) {
  const t = useTranslations("Collection.modal.view");
  const tCondition = useTranslations("Condition");
  const tVersion = useTranslations("JerseyVersion");

  return (
    <div className="space-y-3">
      <div className="space-y-3 @3xl:space-y-0 @3xl:grid @3xl:grid-cols-3 @3xl:gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="version">{t("version")}</Label>
          <Select
            value={formData.version}
            onValueChange={(value: JerseyVersion) =>
              setFormData({ ...formData, version: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VERSION_ORDER.map((v) => (
                <SelectItem key={v} value={v}>
                  {tVersion(v)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 @3xl:contents">
          <div className="space-y-1.5">
            <Label htmlFor="size" className="flex items-center gap-1">
              {t("size")}{" "}
              <span className="text-destructive">{t("sizeRequired")}</span>
            </Label>
            <Select
              value={formData.size}
              onValueChange={(value: Size) =>
                setFormData({ ...formData, size: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
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

          <div className="space-y-1.5">
            <Label htmlFor="condition" className="flex items-center gap-1">
              {t("condition")}{" "}
              <span className="text-destructive">{t("conditionRequired")}</span>
            </Label>
            <Select
              value={formData.condition}
              onValueChange={(value: Condition) =>
                setFormData({ ...formData, condition: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["MINT", "EXCELLENT", "GOOD", "FAIR", "POOR"] as const).map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {tCondition(value)}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="playerName">{t("playerName")}</Label>
          <Input
            id="playerName"
            placeholder={t("playerNamePlaceholder")}
            value={formData.playerName || ""}
            onChange={(e) =>
              setFormData({ ...formData, playerName: e.target.value })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="playerNumber">{t("playerNumber")}</Label>
          <Input
            id="playerNumber"
            type="number"
            min={1}
            max={999}
            placeholder={t("playerNumberPlaceholder")}
            value={formData.playerNumber ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                playerNumber: e.target.value
                  ? parseInt(e.target.value, 10)
                  : undefined,
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2 pt-1">
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
            id="hasLongSleevesEdit"
            checked={formData.hasLongSleeves}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, hasLongSleeves: !!checked })
            }
          />
          <Label htmlFor="hasLongSleevesEdit">{t("longSleeves")}</Label>
        </div>
      </div>

      <Collapsible className="rounded-lg border">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium cursor-pointer hover:bg-muted/40 [&[data-state=open]>svg]:rotate-180">
          <span>{t("cards.patchesTitle")}</span>
          <ChevronDown className="h-4 w-4 transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3">
          <PatchesSection
            jerseyId={jerseyId}
            selectedPatches={formData.patches ?? []}
            onChange={(patches: UserJerseyPatchInput[]) =>
              setFormData({ ...formData, patches })
            }
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
