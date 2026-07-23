"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { FeedLikerPreview } from "@/types/feed";

interface LikersPreviewProps {
  likers: FeedLikerPreview[];
  totalCount: number;
}

export function LikersPreview({ likers, totalCount }: LikersPreviewProps) {
  const t = useTranslations("Feed.likers");
  if (totalCount === 0 || likers.length === 0) return null;

  const firstName = likers[0]?.name;
  let label = "";
  if (totalCount === 1) {
    label = t("single", { name: firstName });
  } else {
    const remaining = totalCount - 1;
    label =
      remaining === 1
        ? t("withOthersSingle", { name: firstName, count: remaining })
        : t("withOthersPlural", { name: firstName, count: remaining });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {likers.slice(0, 3).map((liker) => (
          <div
            key={liker.userId}
            className="relative w-6 h-6 rounded-full ring-2 ring-card overflow-hidden bg-muted"
          >
            {liker.avatarUrl ? (
              <Image
                src={liker.avatarUrl}
                alt={liker.name}
                fill
                unoptimized
                className="object-cover"
                sizes="24px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                {liker.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
}
