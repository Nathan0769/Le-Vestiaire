"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MedalTrophy } from "./medal-trophy";
import { TIER_TEXT, formatRarity } from "./achievement-visuals";
import type { MedalItem } from "./medal-button";

const TIER_GLOW: Record<string, string> = {
  BRONZE: "from-amber-500/15 border-amber-500/40",
  SILVER: "from-slate-400/15 border-slate-400/40",
  GOLD: "from-yellow-500/15 border-yellow-500/40",
  PLATINUM: "from-indigo-500/15 border-indigo-500/40",
};

interface Props {
  item: MedalItem;
  rarity?: number;
  onSelect: (item: MedalItem) => void;
}

export function FeaturedTrophy({ item, rarity, onSelect }: Props) {
  const t = useTranslations();
  const glow = item.tier ? TIER_GLOW[item.tier] : "from-primary/15 border-border";

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        "flex w-full items-center gap-5 rounded-2xl border bg-gradient-to-br to-card p-5 text-left shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer",
        glow,
      )}
    >
      <MedalTrophy
        category={item.category}
        tier={item.tier}
        unlocked
        imageUrl={item.imageUrl}
        size={88}
        className="shrink-0"
      />
      <div className="min-w-0">
        <div
          className={cn(
            "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider",
            item.tier ? TIER_TEXT[item.tier] : "text-primary",
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {item.tier && t(`achievements.tiers.${item.tier}`)}
          {typeof rarity === "number" && (
            <span className="text-muted-foreground">
              ·{" "}
              {t("achievements.detail.rarityValue", {
                percent: formatRarity(rarity),
              })}
            </span>
          )}
        </div>
        <h3 className="mt-1.5 text-xl font-semibold tracking-tight">
          {t(`${item.i18nKey}.title`, item.params ?? {})}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {t(`${item.i18nKey}.description`, item.params ?? {})}
        </p>
      </div>
    </button>
  );
}
