"use client";

import { useTranslations } from "next-intl";
import { User } from "lucide-react";
import { InfoCard } from "./info-card";
import { MyJerseyEditForm } from "./forms/my-jersey-edit-form";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isLightColor } from "@/lib/color-contrast";
import type { UpdateCollectionData } from "@/types/collection";
import type { CollectionItemWithJersey } from "@/types/collection-page";

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

  if (isEditing && formData && setFormData) {
    return (
      <InfoCard icon={User} title={t("cards.myJersey")}>
        <MyJerseyEditForm
          jerseyId={collectionItem.jersey.id}
          formData={formData}
          setFormData={setFormData}
        />
      </InfoCard>
    );
  }

  // View mode
  const hasFlocage = collectionItem.playerName || collectionItem.playerNumber;
  const patchesCount = collectionItem.patches?.length ?? 0;
  const hasPatches = patchesCount > 0;
  const sideBySide = hasFlocage && hasPatches && patchesCount <= 2;

  const baseColor =
    collectionItem.jersey.mainColor ||
    collectionItem.jersey.club.primaryColor ||
    "#1f2937";
  const lightBg = isLightColor(baseColor);
  const clubColor = collectionItem.jersey.club.primaryColor;
  const isWhiteJersey = baseColor === "#fafafa";
  const clubIsLight = isLightColor(clubColor);
  const flocageTextColor = isWhiteJersey
    ? clubIsLight
      ? "#0A0A0A"
      : clubColor
    : lightBg
      ? "#0A0A0A"
      : "#FFFFFF";
  const flocageBorderColor = lightBg
    ? "rgba(0,0,0,0.15)"
    : "rgba(255,255,255,0.25)";

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
                  "relative flex flex-col items-center justify-center rounded-lg shadow-sm overflow-hidden py-3 px-5 border w-fit mx-auto @4xl:mx-0 min-h-[120px]",
                  sideBySide && "@4xl:flex-1"
                )}
                style={{
                  backgroundColor: baseColor,
                  color: flocageTextColor,
                  borderColor: flocageBorderColor,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-1.5 rounded-md border border-dashed"
                  style={{ borderColor: flocageBorderColor }}
                />
                <div className="relative flex flex-col items-center gap-1">
                  {collectionItem.playerName && (
                    <span className="text-xl font-black uppercase tracking-[0.08em] leading-none text-center">
                      {collectionItem.playerName}
                    </span>
                  )}
                  {collectionItem.playerNumber && (
                    <span className="text-3xl font-black tabular-nums leading-none">
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
