"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Gift, Package, Tag } from "lucide-react";
import type { CollectionItemWithJersey } from "@/types/collection-page";
import type { JerseyVersion } from "@/types/collection";

interface BadgesSummaryProps {
  collectionItem: CollectionItemWithJersey;
}

function getConditionColor(condition: string) {
  switch (condition) {
    case "MINT":
      return "bg-green-500/15 text-green-700 border-green-300";
    case "EXCELLENT":
      return "bg-blue-500/15 text-blue-700 border-blue-300";
    case "GOOD":
      return "bg-yellow-500/15 text-yellow-700 border-yellow-300";
    case "FAIR":
      return "bg-orange-500/15 text-orange-700 border-orange-300";
    case "POOR":
      return "bg-red-500/15 text-red-700 border-red-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getVersionAccent(version: string | null | undefined): string {
  switch (version) {
    case "MATCH_WORN":
      return "text-amber-700 bg-amber-500/15 border-amber-300";
    case "PLAYER_ISSUE":
      return "text-purple-700 bg-purple-500/15 border-purple-300";
    case "STOCK_PRO":
      return "text-blue-700 bg-blue-500/15 border-blue-300";
    case "AUTHENTIC":
      return "text-slate-700 bg-slate-500/10 border-slate-300";
    default:
      return "";
  }
}

export function BadgesSummary({ collectionItem }: BadgesSummaryProps) {
  const t = useTranslations("Collection.modal.view");
  const tCondition = useTranslations("Condition");
  const tVersion = useTranslations("JerseyVersion");

  const showVersion =
    collectionItem.version && collectionItem.version !== "REPLICA";

  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge
        variant="secondary"
        className={getConditionColor(collectionItem.condition)}
      >
        {tCondition(
          collectionItem.condition as "MINT" | "EXCELLENT" | "GOOD" | "FAIR" | "POOR"
        )}
      </Badge>

      {collectionItem.size && (
        <Badge variant="outline">
          {t("size")} {collectionItem.size}
        </Badge>
      )}

      {showVersion && (
        <Badge
          variant="outline"
          className={getVersionAccent(collectionItem.version)}
        >
          {tVersion(collectionItem.version as JerseyVersion)}
        </Badge>
      )}

      {collectionItem.isSigned && (
        <Badge
          variant="outline"
          className="text-amber-700 bg-amber-500/15 border-amber-300"
        >
          {t("signed")}
        </Badge>
      )}

      {collectionItem.hasAuthCertificate &&
        (collectionItem.certificateUrl ? (
          <a
            href={collectionItem.certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Badge
              variant="outline"
              className="text-emerald-700 bg-emerald-500/15 border-emerald-300 cursor-pointer hover:bg-emerald-500/20 gap-1"
            >
              {t("authCertificate")}
              <ExternalLink className="w-3 h-3" />
            </Badge>
          </a>
        ) : (
          <Badge
            variant="outline"
            className="text-emerald-700 bg-emerald-500/15 border-emerald-300"
          >
            {t("authCertificate")}
          </Badge>
        ))}

      {collectionItem.hasTags && (
        <Badge variant="outline" className="text-green-600">
          <Tag className="w-3 h-3 mr-1" />
          {t("withTags")}
        </Badge>
      )}

      {collectionItem.isGift && (
        <Badge variant="outline" className="text-primary bg-primary/15">
          <Gift className="w-3 h-3 mr-1" />
          {t("gift")}
        </Badge>
      )}

      {collectionItem.isFromMysteryBox && (
        <Badge variant="outline" className="text-primary bg-primary/15">
          <Package className="w-3 h-3 mr-1" />
          {t("mysteryBox")}
        </Badge>
      )}

      {collectionItem.hasLongSleeves && (
        <Badge variant="outline">{t("longSleeves")}</Badge>
      )}
    </div>
  );
}
