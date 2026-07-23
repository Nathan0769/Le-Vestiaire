"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { CapReachedPayload } from "@/types/feed";

interface Props {
  payload: CapReachedPayload;
}

const CAP_META: Record<string, { big: string; kind: "collection" | "value" }> = {
  COLLECTION_50: { big: "50", kind: "collection" },
  COLLECTION_100: { big: "100", kind: "collection" },
  COLLECTION_500: { big: "500", kind: "collection" },
  COLLECTION_1000: { big: "1000", kind: "collection" },
  VALUE_1K: { big: "1 000€", kind: "value" },
  VALUE_5K: { big: "5 000€", kind: "value" },
  VALUE_25K: { big: "25 000€", kind: "value" },
};

export function PostCardCap({ payload }: Props) {
  const t = useTranslations("Feed.post");
  const meta = CAP_META[payload.capKind] ?? { big: "", kind: "collection" as const };
  const label =
    meta.kind === "collection"
      ? t("capCollectionLabel")
      : t("capValueLabel");

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <div className="grid grid-cols-4 gap-px bg-border h-32">
        {[0, 1, 2, 3].map((i) => {
          const src = payload.mosaic[i]?.imageUrl;
          return (
            <div key={i} className="relative bg-muted">
              {src ? (
                <Image
                  src={src}
                  alt=""
                  fill
                  unoptimized
                  className="object-contain"
                  sizes="140px"
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="bg-gradient-to-br from-primary/90 to-primary p-4 text-primary-foreground text-center">
        <p className="text-3xl md:text-4xl font-bold tracking-tight">
          {meta.big}
        </p>
        <p className="text-xs md:text-sm font-medium mt-0.5 opacity-90">
          {label}
        </p>
      </div>
    </div>
  );
}
