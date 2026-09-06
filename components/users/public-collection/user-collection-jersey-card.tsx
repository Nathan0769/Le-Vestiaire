"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Star, BadgeCheck, Pin, Heart } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserCollectionJerseyModal } from "./user-collection-jersey-modal";
import { buildAuthUrl } from "@/lib/auth-gate";
import type { UserCollectionItem } from "@/types/user-public-collection";
import { useTranslations, useLocale } from "next-intl";
import { translateJerseyName } from "@/lib/translate-jersey-name";
import type { JerseyType } from "@/types/jersey";
import { jerseyTypeLabel } from "@/lib/jersey-utils";
import { isLightColor } from "@/lib/color-contrast";

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

interface UserCollectionJerseyCardProps {
  collectionItem: UserCollectionItem;
  compact?: boolean;
  isAuthenticated?: boolean;
}

export function UserCollectionJerseyCard({
  collectionItem,
  compact = false,
  isAuthenticated = false,
}: UserCollectionJerseyCardProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const tJerseyType = useTranslations("JerseyType");
  const tVersion = useTranslations("JerseyVersion");
  const tCondition = useTranslations("Condition");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const postId = collectionItem.postId ?? null;
  const [hasLiked, setHasLiked] = useState(!!collectionItem.hasLiked);
  const [likeCount, setLikeCount] = useState(collectionItem.likeCount ?? 0);

  // Toggle optimiste du like (même endpoint que le feed) : le serveur reste la
  // source de vérité sur likeCount, rollback en cas d'erreur.
  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur like");
      return (await res.json()) as { hasLiked: boolean; likeCount: number };
    },
    onMutate: () => {
      const previous = { hasLiked, likeCount };
      setHasLiked(!hasLiked);
      setLikeCount(likeCount + (hasLiked ? -1 : 1));
      return previous;
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) {
        setHasLiked(ctx.hasLiked);
        setLikeCount(ctx.likeCount);
      }
    },
    onSuccess: (data) => {
      setHasLiked(data.hasLiked);
      setLikeCount(data.likeCount);
    },
  });

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push(buildAuthUrl("login", pathname));
      return;
    }
    if (!postId || likeMutation.isPending) return;
    likeMutation.mutate();
  };

  const typeLabel = jerseyTypeLabel(
    tJerseyType(collectionItem.jersey.type as JerseyType),
    collectionItem.jersey.type,
    collectionItem.jersey.variant ?? 1
  );

  const versionKey = collectionItem.version as JerseyVersionKey;
  const conditionKey = collectionItem.condition as ConditionKey;
  const versionLabel = tVersion(versionKey);
  const conditionLabel = tCondition(conditionKey);

  const translatedJerseyName = translateJerseyName({
    jersey: {
      name: collectionItem.jersey.name,
      type: collectionItem.jersey.type as JerseyType,
      season: collectionItem.jersey.season,
      clubShortName: collectionItem.jersey.club.shortName,
    },
    locale,
    typeTranslation: typeLabel,
  });

  const hasUserPhoto = !!collectionItem.userPhotoUrl;
  const imageSrc = collectionItem.userPhotoUrl || collectionItem.jersey.imageUrl;
  const patchesCount = collectionItem.patches?.length ?? 0;
  const isPinned = !!collectionItem.pinnedAt;
  const playerName = collectionItem.playerName;
  const playerNumber = collectionItem.playerNumber;
  const hasFloquage = !!(playerName || playerNumber != null);
  const floquageLabel = [
    playerName,
    playerNumber != null ? `#${playerNumber}` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const jerseyColor =
    collectionItem.jersey.mainColor ||
    collectionItem.jersey.club.primaryColor;
  const jerseyColorIsLight = isLightColor(jerseyColor);
  const chipTextColor = jerseyColorIsLight ? "#0a0a0a" : "#ffffff";
  const chipTextShadow = jerseyColorIsLight
    ? "none"
    : "0 1px 2px rgba(0,0,0,0.5)";

  const secondaryLineParts = [
    typeLabel,
    collectionItem.jersey.season,
    collectionItem.jersey.brand,
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
            {isPinned && (
              <span
                className={`bg-zinc-900/95 text-white rounded-full shadow-sm flex items-center justify-center ${
                  compact ? "p-0.5" : "p-1"
                }`}
                aria-label="Épinglé"
              >
                <Pin
                  className={`fill-white ${
                    compact ? "w-2.5 h-2.5" : "w-3 h-3"
                  }`}
                />
              </span>
            )}
            {postId && (
              <button
                type="button"
                onClick={handleLikeClick}
                aria-label={hasLiked ? "Retirer le like" : "Liker"}
                aria-pressed={hasLiked}
                className={`pointer-events-auto flex items-center rounded-full bg-zinc-900/60 backdrop-blur-sm text-white font-semibold shadow-sm transition-colors hover:bg-zinc-900/75 cursor-pointer disabled:opacity-70 ${
                  compact
                    ? "gap-1 px-1.5 py-0.5 text-[10px]"
                    : "gap-1 px-2 py-1 text-[11px]"
                }`}
                disabled={likeMutation.isPending}
              >
                <Heart
                  className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} ${
                    hasLiked ? "fill-red-500 text-red-500" : "text-white"
                  }`}
                />
                {likeCount}
              </button>
            )}
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
                  src={collectionItem.jersey.club.logoUrl}
                  alt={collectionItem.jersey.club.name}
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
                  {collectionItem.jersey.club.name}
                </p>
                {!compact && collectionItem.isSigned && (
                  <Star
                    className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0"
                    aria-label="Signé"
                  />
                )}
                {!compact && collectionItem.hasAuthCertificate && (
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

      <UserCollectionJerseyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        collectionItem={collectionItem}
      />
    </>
  );
}
