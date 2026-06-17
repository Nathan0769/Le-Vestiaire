"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { CollectionItemWithJersey } from "@/types/collection-page";
import type { JerseyType } from "@/types/jersey";
import { jerseyTypeLabel } from "@/lib/jersey-utils";
import { translateJerseyName } from "@/lib/translate-jersey-name";

interface JerseyHeaderProps {
  collectionItem: CollectionItemWithJersey;
}

export function JerseyHeader({ collectionItem }: JerseyHeaderProps) {
  const locale = useLocale();
  const t = useTranslations("Collection.modal.view");
  const tJerseyType = useTranslations("JerseyType");

  const typeLabel = jerseyTypeLabel(
    tJerseyType(collectionItem.jersey.type as JerseyType),
    collectionItem.jersey.type,
    collectionItem.jersey.variant ?? 1
  );

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

  return (
    <div className="flex items-start gap-3 pb-1">
      <div className="relative w-12 h-12 @4xl:w-14 @4xl:h-14 shrink-0 rounded-full bg-white border overflow-hidden">
        <Image
          src={collectionItem.jersey.club.logoUrl}
          alt={collectionItem.jersey.club.name}
          fill
          className="object-contain p-1"
          unoptimized
        />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-xl @4xl:text-2xl font-bold leading-tight tracking-tight">
          {translatedJerseyName}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {collectionItem.jersey.club.name} ·{" "}
          {collectionItem.jersey.club.league.name}
        </p>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-2 text-xs text-muted-foreground">
          <span>
            {t("season")} {collectionItem.jersey.season}
          </span>
          <span aria-hidden>·</span>
          <span>{typeLabel}</span>
          <span aria-hidden>·</span>
          <span>{collectionItem.jersey.brand}</span>
        </div>
      </div>
    </div>
  );
}
