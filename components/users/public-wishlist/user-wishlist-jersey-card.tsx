"use client";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import type { UserWishlistItem } from "@/types/user-public-collection";
import { useTranslations, useLocale } from "next-intl";
import { translateJerseyName } from "@/lib/translate-jersey-name";
import type { JerseyType } from "@/types/jersey";
import { jerseyTypeLabel } from "@/lib/jersey-utils";

interface UserWishlistJerseyCardProps {
  wishlistItem: UserWishlistItem;
}

export function UserWishlistJerseyCard({
  wishlistItem,
}: UserWishlistJerseyCardProps) {
  const locale = useLocale();
  const tJerseyType = useTranslations("JerseyType");

  const translatedJerseyName = translateJerseyName({
    jersey: {
      name: wishlistItem.jersey.name,
      type: wishlistItem.jersey.type as JerseyType,
      season: wishlistItem.jersey.season,
      clubShortName: wishlistItem.jersey.club.shortName,
    },
    locale,
    typeTranslation: jerseyTypeLabel(tJerseyType(wishlistItem.jersey.type as JerseyType), wishlistItem.jersey.type, wishlistItem.jersey.variant ?? 1),
  });

  return (
    <Card className="transition-all hover:shadow-lg group w-full overflow-hidden">
      <CardContent className="p-3 space-y-3">
        <div className="relative aspect-square w-full overflow-hidden">
          <Image
            src={wishlistItem.jersey.imageUrl}
            alt={translatedJerseyName}
            fill
            className="object-contain group-hover:scale-105 transition-transform"
          />
        </div>
        <div className="space-y-2 min-w-0">
          <p className="text-sm font-medium text-center line-clamp-2 break-words">
            {wishlistItem.jersey.club.name}
          </p>
          <p className="text-xs text-muted-foreground text-center truncate">
            {jerseyTypeLabel(tJerseyType(wishlistItem.jersey.type as JerseyType), wishlistItem.jersey.type, wishlistItem.jersey.variant ?? 1)} •{" "}
            {wishlistItem.jersey.season}
          </p>
          {wishlistItem.jersey.retailPrice && (
            <p className="text-xs font-semibold text-center text-primary">
              {wishlistItem.jersey.retailPrice}€
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
