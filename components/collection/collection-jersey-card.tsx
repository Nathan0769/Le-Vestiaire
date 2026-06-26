"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, BadgeCheck, Pin } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CollectionJerseyModal } from "./collection-jersey-modal";
import type { CollectionItemWithJersey } from "@/types/collection-page";
import { useTranslations, useLocale } from "next-intl";
import type { JerseyType } from "@/types/jersey";
import { jerseyTypeLabel } from "@/lib/jersey-utils";
import { translateJerseyName } from "@/lib/translate-jersey-name";
import { isLightColor } from "@/lib/color-contrast";
import { MAX_PINS } from "@/lib/collection-pin";
import { toast } from "sonner";

type JerseyVersionKey =
  | "REPLICA"
  | "AUTHENTIC"
  | "STOCK_PRO"
  | "PLAYER_ISSUE"
  | "MATCH_WORN";

type ConditionKey = "MINT" | "EXCELLENT" | "GOOD" | "FAIR" | "POOR";

const VERSION_BADGE_CLASSES: Record<JerseyVersionKey, string> = {
  REPLICA: "bg-sky-600/90 text-white",
  AUTHENTIC: "bg-purple-600/90 text-white",
  STOCK_PRO: "bg-cyan-600/90 text-white",
  PLAYER_ISSUE: "bg-amber-500/95 text-white",
  MATCH_WORN: "bg-red-600/90 text-white",
};

const CONDITION_DOT_CLASSES: Record<ConditionKey, string> = {
  MINT: "bg-green-500",
  EXCELLENT: "bg-blue-500",
  GOOD: "bg-yellow-500",
  FAIR: "bg-orange-500",
  POOR: "bg-red-500",
};

interface CollectionJerseyCardProps {
  collectionItem: CollectionItemWithJersey;
  onUpdate?: (updatedItem: CollectionItemWithJersey) => void;
  onDelete?: (deletedItemId: string) => void;
  compact?: boolean;
}

export function CollectionJerseyCard({
  collectionItem,
  onUpdate,
  onDelete,
  compact = false,
}: CollectionJerseyCardProps) {
  const locale = useLocale();
  const tJerseyType = useTranslations("JerseyType");
  const tVersion = useTranslations("JerseyVersion");
  const tCondition = useTranslations("Condition");
  const tCard = useTranslations("Collection.card");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localItem, setLocalItem] = useState(collectionItem);
  const [isPinning, setIsPinning] = useState(false);

  const typeLabel = jerseyTypeLabel(
    tJerseyType(localItem.jersey.type as JerseyType),
    localItem.jersey.type,
    localItem.jersey.variant ?? 1
  );

  const versionKey = localItem.version as JerseyVersionKey;
  const conditionKey = localItem.condition as ConditionKey;
  const versionLabel = tVersion(versionKey);
  const conditionLabel = tCondition(conditionKey);

  const translatedJerseyName = translateJerseyName({
    jersey: {
      name: localItem.jersey.name,
      type: localItem.jersey.type as JerseyType,
      season: localItem.jersey.season,
      clubShortName: localItem.jersey.club.shortName,
    },
    locale,
    typeTranslation: typeLabel,
  });

  const handleUpdate = (updatedItem: CollectionItemWithJersey) => {
    setLocalItem(updatedItem);
    onUpdate?.(updatedItem);
  };

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPinning) return;
    setIsPinning(true);
    const willBePinned = !localItem.pinnedAt;
    try {
      const response = await fetch(
        `/api/user-jerseys/${localItem.id}/pin`,
        { method: willBePinned ? "POST" : "DELETE" }
      );
      const result = await response.json();
      if (response.ok) {
        toast.success(
          willBePinned ? tCard("toast.pinned") : tCard("toast.unpinned")
        );
        handleUpdate({ ...localItem, pinnedAt: result.pinnedAt });
      } else if (response.status === 409 && result.code === "PIN_LIMIT_REACHED") {
        toast.error(tCard("toast.pinLimitReached", { max: MAX_PINS }));
      } else {
        toast.error(result.error || tCard("toast.error"));
      }
    } catch (error) {
      console.error("Erreur lors du pin/unpin:", error);
      toast.error(tCard("toast.connectionError"));
    } finally {
      setIsPinning(false);
    }
  };

  const hasUserPhoto = !!localItem.userPhotoUrl;
  const imageSrc = localItem.userPhotoUrl || localItem.jersey.imageUrl;
  const patchesCount = localItem.patches?.length ?? 0;
  const isPinned = !!localItem.pinnedAt;
  const playerName = localItem.playerName;
  const playerNumber = localItem.playerNumber;
  const hasFloquage = !!(playerName || playerNumber != null);
  const floquageLabel = [
    playerName,
    playerNumber != null ? `#${playerNumber}` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const jerseyColor =
    localItem.jersey.mainColor || localItem.jersey.club.primaryColor;
  const jerseyColorIsLight = isLightColor(jerseyColor);
  const chipTextColor = jerseyColorIsLight ? "#0a0a0a" : "#ffffff";
  const chipTextShadow = jerseyColorIsLight
    ? "none"
    : "0 1px 2px rgba(0,0,0,0.5)";

  const secondaryLineParts = [
    typeLabel,
    localItem.jersey.season,
    localItem.jersey.brand,
    patchesCount > 0
      ? `${patchesCount} patch${patchesCount > 1 ? "es" : ""}`
      : null,
  ].filter(Boolean);

  return (
    <>
      <div
        className={`cursor-pointer group relative rounded-xl overflow-hidden bg-muted shadow-sm hover:shadow-xl transition-shadow ${
          compact ? "aspect-square" : "aspect-[3/4]"
        }`}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
          <div
            className={`relative ${compact ? "w-[72%] h-[72%]" : "w-[78%] h-[78%]"}`}
          >
            <Image
              src={imageSrc}
              alt={translatedJerseyName}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={hasUserPhoto ? "object-cover rounded-md" : "object-contain"}
            />
          </div>
        </div>

        <div
          className={`absolute left-2 right-2 flex justify-between items-start gap-2 pointer-events-none ${
            compact ? "top-1.5" : "top-2"
          }`}
        >
          <div className={`flex items-center ${compact ? "gap-1" : "gap-1.5"}`}>
            {localItem.size && (
              <span
                className={`bg-white/90 text-zinc-900 font-semibold rounded-md backdrop-blur-sm shadow-sm ${
                  compact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1"
                }`}
              >
                {localItem.size}
              </span>
            )}
            <button
              type="button"
              onClick={handleTogglePin}
              disabled={isPinning}
              aria-label={isPinned ? tCard("unpin") : tCard("pin")}
              aria-pressed={isPinned}
              className={`pointer-events-auto shrink-0 rounded-full shadow-sm items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm flex ${
                isPinned
                  ? "bg-zinc-900/95 text-white hover:bg-zinc-800"
                  : "bg-white/90 text-zinc-700 hover:bg-white hover:text-zinc-900 [@media(hover:hover)]:hidden group-hover:[@media(hover:hover)]:flex"
              } ${compact ? "p-0.5" : "p-1"}`}
            >
              <Pin
                className={`${isPinned ? "fill-white" : ""} ${
                  compact ? "w-2.5 h-2.5" : "w-3 h-3"
                }`}
              />
            </button>
          </div>

          <div
            className={`flex flex-col items-end max-w-[70%] ${
              compact ? "gap-1" : "gap-1.5"
            }`}
          >
            <span
              className={`font-semibold rounded-md backdrop-blur-sm truncate max-w-full shadow-sm ${
                compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-1"
              } ${VERSION_BADGE_CLASSES[versionKey] ?? VERSION_BADGE_CLASSES.REPLICA}`}
            >
              {versionLabel}
            </span>
            {!compact && hasFloquage && (
              <span
                className="text-[11px] font-bold px-2 py-1 rounded-md shadow-sm truncate max-w-full"
                style={{
                  backgroundColor: jerseyColor,
                  border: "1px solid rgba(0,0,0,0.25)",
                  color: chipTextColor,
                  textShadow: chipTextShadow,
                }}
              >
                {floquageLabel}
              </span>
            )}
          </div>
        </div>

        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent pointer-events-none ${
            compact ? "p-2 pt-5" : "p-3 pt-6"
          }`}
        >
          <div className={`flex items-center ${compact ? "gap-1.5" : "gap-2"}`}>
            <div
              className={`relative shrink-0 rounded-full bg-white ${
                compact ? "w-7 h-7 p-1" : "w-9 h-9 p-1.5"
              }`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={localItem.jersey.club.logoUrl}
                  alt={localItem.jersey.club.name}
                  fill
                  sizes={compact ? "28px" : "36px"}
                  className="object-contain"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p
                  className={`text-white font-semibold truncate leading-tight ${
                    compact ? "text-xs" : "text-base"
                  }`}
                >
                  {localItem.jersey.club.name}
                </p>
                {!compact && localItem.isSigned && (
                  <Star
                    className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0"
                    aria-label="Signé"
                  />
                )}
                {!compact && localItem.hasAuthCertificate && (
                  <BadgeCheck
                    className="w-3.5 h-3.5 text-sky-400 shrink-0"
                    aria-label="Certificat d'authentification"
                  />
                )}
              </div>
              {!compact && (
                <p className="text-white/80 text-[11px] truncate leading-tight">
                  {secondaryLineParts.join(" · ")}
                </p>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={`pointer-events-auto rounded-full shrink-0 ring-2 ring-black/40 cursor-help ${
                    compact ? "w-2 h-2" : "w-2.5 h-2.5"
                  } ${CONDITION_DOT_CLASSES[conditionKey] ?? "bg-muted"}`}
                  aria-label={conditionLabel}
                />
              </TooltipTrigger>
              <TooltipContent>{conditionLabel}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      <CollectionJerseyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        collectionItem={localItem}
        onUpdate={handleUpdate}
        onDelete={onDelete}
      />
    </>
  );
}
