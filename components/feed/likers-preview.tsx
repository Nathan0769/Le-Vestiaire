"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { FeedLikerPreview } from "@/types/feed";

interface LikersPreviewProps {
  likers: FeedLikerPreview[];
  totalCount: number;
}

export function LikersPreview({ likers, totalCount }: LikersPreviewProps) {
  const t = useTranslations("Feed.likers");
  if (totalCount === 0 || likers.length === 0) return null;

  const firstName = likers[0]?.name;
  const firstIsSupporter = likers[0]?.isSupporter ?? false;
  const nameTag = {
    n: (chunks: React.ReactNode) => (
      <span className={cn(firstIsSupporter && "cos-name-gold font-semibold")}>
        {chunks}
      </span>
    ),
  };

  let label: React.ReactNode = "";
  if (totalCount === 1) {
    label = t.rich("single", { name: firstName, ...nameTag });
  } else {
    const remaining = totalCount - 1;
    label = t.rich(remaining === 1 ? "withOthersSingle" : "withOthersPlural", {
      name: firstName,
      count: remaining,
      ...nameTag,
    });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {likers.slice(0, 3).map((liker) => (
          <div
            key={liker.userId}
            className={cn(
              "relative w-6 h-6 rounded-full ring-2 overflow-hidden bg-muted",
              liker.isSupporter ? "ring-[#c9a84c]" : "ring-card"
            )}
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
