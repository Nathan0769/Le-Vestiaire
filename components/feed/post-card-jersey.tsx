"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { JerseyAddPayload } from "@/types/feed";
import type { UserCollectionItem } from "@/types/user-public-collection";
import { UserCollectionJerseyModal } from "@/components/users/public-collection/user-collection-jersey-modal";
import { isLightColor } from "@/lib/color-contrast";

interface Props {
  payload: JerseyAddPayload;
}

const CONDITION_DOT: Record<string, string> = {
  MINT: "bg-emerald-500",
  EXCELLENT: "bg-emerald-500",
  GOOD: "bg-amber-500",
  FAIR: "bg-orange-500",
  POOR: "bg-red-500",
};

export function PostCardJersey({ payload }: Props) {
  const t = useTranslations("Feed.post");
  const [modalOpen, setModalOpen] = useState(false);
  const displayImage = payload.customPhotoUrl ?? payload.jersey.imageUrl;
  const conditionDot = CONDITION_DOT[payload.condition] ?? "bg-muted-foreground";
  const conditionLabel = t(`conditions.${payload.condition}` as never);
  const typeLabel = t(`types.${payload.jersey.type}` as never);
  const versionLabel = t(`versions.${payload.version}` as never);
  const title = t("jerseyTitleTemplate", {
    type: typeLabel,
    club: payload.jersey.club.shortName,
    season: payload.jersey.season,
  });

  const fullItem = useQuery({
    queryKey: ["user-jersey-detail", payload.userJerseyId],
    enabled: modalOpen,
    queryFn: async () => {
      const res = await fetch(`/api/user-jerseys/${payload.userJerseyId}`);
      if (!res.ok) throw new Error("fetch error");
      return (await res.json()) as UserCollectionItem;
    },
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="block w-full text-left cursor-pointer group"
      >
        <div className="relative bg-muted/40 aspect-square w-full overflow-hidden">
          <Image
            src={displayImage}
            alt={title}
            fill
            unoptimized
            className="object-contain p-3 transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 512px"
          />
          {payload.clubRank && payload.clubRank % 10 === 0 && (
            <div className="absolute top-3 left-3 bg-black/80 text-white text-xs font-medium rounded-full px-3 py-1.5">
              {payload.clubRank}
              <sup>e</sup> · {payload.jersey.club.shortName}
            </div>
          )}
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-semibold rounded-full px-3 py-1.5">
            {versionLabel}
          </div>
        </div>
      </button>

      <div className="px-3 pt-3 pb-2 space-y-2">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="text-left cursor-pointer group block w-full"
        >
          <p className="font-semibold text-base leading-snug group-hover:underline">
            {title}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {payload.jersey.club.shortName} · {payload.jersey.season}
            {payload.patchesCount > 0 && (
              <>
                {" · "}
                {payload.patchesCount === 1
                  ? t("patchSingle")
                  : t("patchMany", { count: payload.patchesCount })}
              </>
            )}
          </p>
        </button>

        <div className="flex flex-wrap gap-1.5">
          <Chip>
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${conditionDot} mr-1.5`}
            />
            {conditionLabel}
          </Chip>
          {payload.size && <Chip>{t("size", { size: payload.size })}</Chip>}
          {payload.purchasePrice !== null && payload.purchasePrice > 0 && (
            <Chip>{payload.purchasePrice}€</Chip>
          )}
          {payload.playerName && (
            <PlayerChip
              name={payload.playerName}
              number={payload.playerNumber}
              jerseyColor={
                payload.jersey.mainColor ?? payload.jersey.club.primaryColor
              }
            />
          )}
        </div>
      </div>

      {modalOpen && fullItem.data && (
        <UserCollectionJerseyModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          collectionItem={fullItem.data}
        />
      )}
    </>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium bg-muted/60 border border-border/50 text-foreground">
      {children}
    </span>
  );
}

function PlayerChip({
  name,
  number,
  jerseyColor,
}: {
  name: string;
  number: number | null;
  jerseyColor: string;
}) {
  const isLight = isLightColor(jerseyColor);
  const textColor = isLight ? "#0a0a0a" : "#ffffff";
  const textShadow = isLight ? "none" : "0 1px 2px rgba(0,0,0,0.5)";
  return (
    <span
      className="inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold border border-black/20"
      style={{
        backgroundColor: jerseyColor,
        color: textColor,
        textShadow,
      }}
    >
      {name}
      {number != null ? ` #${number}` : ""}
    </span>
  );
}
