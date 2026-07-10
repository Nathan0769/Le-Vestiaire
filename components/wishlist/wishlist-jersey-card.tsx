"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Heart, ExternalLink } from "lucide-react";
import type { JerseyType } from "@prisma/client";

const TYPE_BADGE_CLASSES: Partial<Record<JerseyType, string>> = {
  HOME: "bg-red-50 text-red-800 border border-red-200",
  AWAY: "bg-blue-50 text-blue-800 border border-blue-200",
  THIRD: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  FOURTH: "bg-purple-50 text-purple-800 border border-purple-200",
  GOALKEEPER: "bg-amber-50 text-amber-800 border border-amber-200",
  SPECIAL: "bg-pink-50 text-pink-800 border border-pink-200",
  HALLOWEEN: "bg-orange-50 text-orange-800 border border-orange-200",
  OKTOBERFEST: "bg-yellow-50 text-yellow-800 border border-yellow-200",
  CENTENAIRE: "bg-amber-50 text-amber-800 border border-amber-200",
  HUMANRACE: "bg-teal-50 text-teal-800 border border-teal-200",
  ONE_PLANET: "bg-green-50 text-green-800 border border-green-200",
  OCTOBRE_ROSE: "bg-pink-50 text-pink-800 border border-pink-200",
  ANTI_RACISME: "bg-slate-100 text-slate-800 border border-slate-200",
  HOMMAGE: "bg-slate-50 text-slate-800 border border-slate-200",
  NOUVEL_AN_CHINOIS: "bg-red-50 text-red-800 border border-red-200",
  OFF_WHITE: "bg-zinc-50 text-zinc-900 border border-zinc-200",
  KOCHE: "bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-200",
  CHAMPION: "bg-yellow-50 text-yellow-800 border border-yellow-200",
  ANNIVERSARY: "bg-amber-50 text-amber-800 border border-amber-200",
};

const DEFAULT_TYPE_BADGE =
  "bg-white/90 text-zinc-900 border border-zinc-200";
import { getJerseyUrl } from "@/lib/jersey-url";
import { translateJerseyName } from "@/lib/translate-jersey-name";
import { jerseyTypeLabel } from "@/lib/jersey-utils";
import { trackEvent } from "@/lib/analytics";

interface Props {
  jersey: {
    id: string;
    name: string;
    imageUrl: string;
    type: JerseyType;
    slug?: string | null;
    season: string;
    variant?: number;
    brand?: string | null;
  };
  club: {
    id: string;
    name: string;
    shortName: string;
    logoUrl: string;
    leagueId: string;
  };
  cfsAvailability: {
    id: string;
    price: string;
    promoPrice: string | null;
    affiliateUrl: string;
  } | null;
}

export function WishlistJerseyCard({ jersey, club, cfsAvailability }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const tJerseyType = useTranslations("JerseyType");
  const tCfs = useTranslations("Wishlist.cfsMatch");

  const typeLabel = jerseyTypeLabel(
    tJerseyType(jersey.type),
    jersey.type,
    jersey.variant ?? 1
  );
  const translatedName = translateJerseyName({
    jersey: {
      name: jersey.name,
      type: jersey.type,
      season: jersey.season,
      clubShortName: club.shortName,
    },
    locale,
    typeTranslation: typeLabel,
  });

  const price = cfsAvailability ? parseFloat(cfsAvailability.price) : null;
  const promoPrice = cfsAvailability?.promoPrice
    ? parseFloat(cfsAvailability.promoPrice)
    : null;
  const inPromo =
    promoPrice !== null && price !== null && promoPrice < price;
  const discount =
    inPromo && price !== null && promoPrice !== null
      ? Math.round(((price - promoPrice) / price) * 100)
      : 0;

  useEffect(() => {
    if (!cfsAvailability) return;
    if (typeof window === "undefined") return;
    const key = `cfs-viewed-${jersey.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    trackEvent({
      name: "cfs_wishlist_match_view",
      params: {
        jersey_id: jersey.id,
        club_id: club.id,
        season: jersey.season,
        promo_id: cfsAvailability.id,
        discount_pct: discount,
        in_promo: inPromo ? 1 : 0,
      },
    });
  }, [
    cfsAvailability,
    jersey.id,
    club.id,
    jersey.season,
    discount,
    inPromo,
  ]);

  const handleCardClick = () => {
    router.push(
      getJerseyUrl(club.leagueId, club.id, jersey.slug || jersey.id)
    );
  };

  const handleCfsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cfsAvailability) return;
    trackEvent({
      name: "cfs_wishlist_match_click",
      params: {
        jersey_id: jersey.id,
        club_id: club.id,
        season: jersey.season,
        promo_id: cfsAvailability.id,
        discount_pct: discount,
        in_promo: inPromo ? 1 : 0,
      },
    });
    window.open(
      cfsAvailability.affiliateUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const secondaryLine = [jersey.season, jersey.brand]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="cursor-pointer group relative rounded-xl overflow-hidden bg-muted shadow-sm hover:shadow-xl transition-shadow aspect-[3/4]"
      onClick={handleCardClick}
    >
      <div className="absolute inset-0 flex items-center justify-center pt-4 pb-24 px-4 transition-transform duration-500 group-hover:scale-105">
        <div className="relative w-full h-full max-w-[85%] max-h-[85%] aspect-square mx-auto">
          <Image
            src={jersey.imageUrl}
            alt={translatedName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain"
          />
        </div>
      </div>

      <div className="absolute left-2 right-2 top-2 flex justify-between items-start gap-2 pointer-events-none">
        <span
          className={`font-semibold rounded-md backdrop-blur-sm shadow-sm text-[11px] px-2 py-1 ${
            TYPE_BADGE_CLASSES[jersey.type] ?? DEFAULT_TYPE_BADGE
          }`}
        >
          {typeLabel}
        </span>
        <span
          className="bg-primary/95 text-primary-foreground rounded-full shadow-sm p-1.5"
          aria-label="Dans la wishlist"
        >
          <Heart className="w-3 h-3 fill-current" />
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        {cfsAvailability && price !== null && (
          <div className="px-3 pb-2">
            <button
              type="button"
              onClick={handleCfsClick}
              aria-label={
                inPromo
                  ? tCfs("badge.discount", { percent: discount })
                  : tCfs("badge.available")
              }
              className={`pointer-events-auto w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer transition-transform hover:scale-[1.02] shadow-md ${
                inPromo
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
                {inPromo && promoPrice !== null ? (
                  <>
                    <span className="text-sm font-bold">
                      {promoPrice.toFixed(2)}€
                    </span>
                    <span className="text-[10px] line-through opacity-70">
                      {price.toFixed(2)}€
                    </span>
                    <span className="text-[10px] font-bold bg-white/20 rounded px-1 py-0.5">
                      -{discount}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-bold">
                      {price.toFixed(2)}€
                    </span>
                    <span className="text-[10px] opacity-70">
                      {tCfs("badge.available")}
                    </span>
                  </>
                )}
              </div>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </button>
          </div>
        )}

        <div className="bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 pt-6">
          <div className="flex items-center gap-2">
            <div className="relative shrink-0 rounded-full bg-white w-9 h-9 p-1.5">
              <div className="relative w-full h-full">
                <Image
                  src={club.logoUrl}
                  alt={club.name}
                  fill
                  sizes="36px"
                  className="object-contain"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate leading-tight text-base">
                {club.name}
              </p>
              {secondaryLine && (
                <p className="text-white/80 text-[11px] truncate leading-tight">
                  {secondaryLine}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
