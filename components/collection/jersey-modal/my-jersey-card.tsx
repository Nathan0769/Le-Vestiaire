"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, User } from "lucide-react";
import { InfoCard } from "./info-card";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { SIZE_LABELS } from "@/types/collection";
import type {
  Condition,
  JerseyVersion,
  Size,
  UpdateCollectionData,
} from "@/types/collection";
import type { CollectionItemWithJersey } from "@/types/collection-page";
import type { UserJerseyPatchInput } from "@/types/patch";

const VERSION_ORDER: JerseyVersion[] = [
  "REPLICA",
  "AUTHENTIC",
  "STOCK_PRO",
  "PLAYER_ISSUE",
  "MATCH_WORN",
];

interface MyJerseyCardProps {
  collectionItem: CollectionItemWithJersey;
  isEditing?: boolean;
  formData?: UpdateCollectionData;
  setFormData?: (data: UpdateCollectionData) => void;
}

export function MyJerseyCard({
  collectionItem,
  isEditing = false,
  formData,
  setFormData,
}: MyJerseyCardProps) {
  const t = useTranslations("Collection.modal.view");
  const tCondition = useTranslations("Condition");
  const tVersion = useTranslations("JerseyVersion");

  if (isEditing && formData && setFormData) {
    return (
      <InfoCard icon={User} title={t("cards.myJersey")}>
        <div className="space-y-3">
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

          <div className="grid grid-cols-2 gap-3">
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
                <span className="text-destructive">
                  {t("conditionRequired")}
                </span>
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
                jerseyId={collectionItem.jersey.id}
                selectedPatches={formData.patches ?? []}
                onChange={(patches: UserJerseyPatchInput[]) =>
                  setFormData({ ...formData, patches })
                }
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </InfoCard>
    );
  }

  // View mode
  const hasFlocage = collectionItem.playerName || collectionItem.playerNumber;
  const patchesCount = collectionItem.patches?.length ?? 0;
  const hasPatches = patchesCount > 0;
  const sideBySide = hasFlocage && hasPatches && patchesCount <= 2;

  return (
    <InfoCard icon={User} title={t("cards.myJersey")}>
      {(hasFlocage || hasPatches) && (
        <div
          className={cn(
            "space-y-3",
            sideBySide &&
              "@4xl:space-y-0 @4xl:flex @4xl:items-stretch @4xl:gap-8"
          )}
        >
          {hasFlocage && (
            <div
              className={cn(
                "space-y-2",
                sideBySide && "@4xl:shrink-0 @4xl:flex @4xl:flex-col"
              )}
            >
              <span className="block text-muted-foreground text-center @4xl:text-left">
                {t("cards.flocageTitle")}
              </span>
              <div
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-lg shadow-sm overflow-hidden py-3 px-5 bg-[#FAF5EE] border w-fit mx-auto @4xl:mx-0 min-h-[120px]",
                  sideBySide && "@4xl:flex-1"
                )}
              >
                <div className="pointer-events-none absolute inset-1.5 rounded-md border border-dashed border-foreground/15" />
                <div className="relative flex flex-col items-center gap-1">
                  {collectionItem.playerName && (
                    <span className="text-xl font-black uppercase tracking-[0.08em] text-foreground leading-none text-center">
                      {collectionItem.playerName}
                    </span>
                  )}
                  {collectionItem.playerNumber && (
                    <span className="text-3xl font-black tabular-nums text-foreground leading-none">
                      {collectionItem.playerNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {hasPatches && (
            <div
              className={cn("space-y-2", sideBySide && "@4xl:flex-1")}
            >
              <span className="block text-muted-foreground">
                {patchesCount === 1
                  ? t("cards.patchTitle")
                  : t("cards.patchesTitle")}
              </span>
              <div className="flex flex-wrap gap-1">
                {collectionItem.patches!.map((p) => {
                  const label = p.patch?.name ?? p.customLabel ?? "";
                  const activeVersion = p.patch?.versions.find((v) => {
                    const afterStart =
                      v.seasonStart <= collectionItem.jersey.season;
                    const beforeEnd =
                      v.seasonEnd === null ||
                      v.seasonEnd >= collectionItem.jersey.season;
                    return afterStart && beforeEnd;
                  });
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col items-center gap-1 rounded-md border bg-background p-1 shadow-sm w-[112px]"
                    >
                      {activeVersion?.imageUrl ? (
                        <div className="relative w-full aspect-square rounded-md bg-white overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={activeVersion.imageUrl}
                            alt={label}
                            className="absolute inset-0 w-full h-full object-contain p-1"
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-square rounded-md bg-muted" />
                      )}
                      <span className="text-[10px] font-semibold text-center text-foreground line-clamp-2 leading-tight">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!hasFlocage && !hasPatches && (
        <p className="text-xs text-muted-foreground italic">
          {t("cards.myJerseyEmpty")}
        </p>
      )}
    </InfoCard>
  );
}
