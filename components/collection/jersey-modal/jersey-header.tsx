"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { JerseyType } from "@/types/jersey";
import { jerseyTypeLabel } from "@/lib/jersey-utils";
import { translateJerseyName } from "@/lib/translate-jersey-name";

export interface JerseyHeaderJersey {
  name: string;
  type: string;
  variant: number;
  season: string;
  brand: string;
  club: {
    name: string;
    shortName: string;
    logoUrl: string;
    league: { name: string };
  };
}

interface JerseyHeaderProps {
  jersey: JerseyHeaderJersey;
}

export function JerseyHeader({ jersey }: JerseyHeaderProps) {
  const locale = useLocale();
  const t = useTranslations("Collection.modal.view");
  const tJerseyType = useTranslations("JerseyType");

  const typeLabel = jerseyTypeLabel(
    tJerseyType(jersey.type as JerseyType),
    jersey.type,
    jersey.variant ?? 1
  );

  const translatedJerseyName = translateJerseyName({
    jersey: {
      name: jersey.name,
      type: jersey.type as JerseyType,
      season: jersey.season,
      clubShortName: jersey.club.shortName,
    },
    locale,
    typeTranslation: typeLabel,
  });

  return (
    <div className="flex items-start gap-3 pb-1">
      <div className="relative w-12 h-12 @4xl:w-14 @4xl:h-14 shrink-0 rounded-full bg-white border overflow-hidden">
        <Image
          src={jersey.club.logoUrl}
          alt={jersey.club.name}
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
          {jersey.club.name} · {jersey.club.league.name}
        </p>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-2 text-xs text-muted-foreground">
          <span>
            {t("season")} {jersey.season}
          </span>
          <span aria-hidden>·</span>
          <span>{typeLabel}</span>
          <span aria-hidden>·</span>
          <span>{jersey.brand}</span>
        </div>
      </div>
    </div>
  );
}
