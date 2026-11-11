"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Heart } from "lucide-react";
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
import type { PartnerOffer } from "@/lib/partner-shops/offers";
import { ShopOfferBadge } from "@/components/wishlist/shop-offer-badge";
import { wishlistOffers, type WishlistCfsInput, type WishlistOffer } from "@/lib/wishlist-offers";

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
  /** Offre CFS déjà passée par `cfsOfferInput` (liens marqués, tailles en stock). */
  cfsAvailability: (WishlistCfsInput & { id: string }) | null;
  partnerOffers?: PartnerOffer[];
  /** Taille voulue : écarte les boutiques qui ne l'ont pas. */
  size?: string | null;
  /** Coup de cœur : cœur rose au lieu de la couleur primaire. */
  favorite?: boolean;
}

type CardOffer = WishlistOffer;

const discountOf = (price: number, reference: number | null) =>
  reference !== null && reference > price ? Math.round(((reference - price) / reference) * 100) : 0;

export function WishlistJerseyCard({ jersey, club, cfsAvailability, partnerOffers = [], size, favorite = false }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const tJerseyType = useTranslations("JerseyType");
  const tShop = useTranslations("Wishlist.shopMatch");
  const tGift = useTranslations("Wishlist.gift");

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

  // CFS et boutiques partenaires du moins cher au plus cher, filtrées par la taille voulue.
  const offers: CardOffer[] = wishlistOffers({ cfs: cfsAvailability, partnerOffers, size: size ?? null });
  const cfsOffer = offers.find((o) => o.shop === "cfs");
  const discount = cfsOffer?.discount ?? 0;
  const inPromo = discount > 0;

  const partnerShops = partnerOffers.map((o) => o.shop).join(",");
  useEffect(() => {
    if (!partnerShops || typeof window === "undefined") return;
    for (const offer of partnerOffers) {
      const key = `partner-viewed-${offer.shop}-${jersey.id}`;
      if (sessionStorage.getItem(key)) continue;
      sessionStorage.setItem(key, "1");
      trackEvent({
        name: "partner_wishlist_match_view",
        params: {
          jersey_id: jersey.id,
          club_id: club.id,
          season: jersey.season,
          shop: offer.shop,
          discount_pct: discountOf(offer.price, offer.compareAtPrice),
        },
      });
    }
    // partnerShops résume la liste : l'effet ne repart pas à chaque rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerShops, jersey.id, club.id, jersey.season]);

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

  const handleOfferClick = (offer: CardOffer) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (offer.shop !== "cfs") {
      trackEvent({
        name: "partner_wishlist_match_click",
        params: {
          jersey_id: jersey.id,
          club_id: club.id,
          season: jersey.season,
          shop: offer.shop,
          discount_pct: offer.discount,
        },
      });
      window.open(offer.url, "_blank", "noopener,noreferrer");
      return;
    }
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
    // Lien de la taille voulue (ou voisine), pas forcément le produit le moins cher.
    window.open(offer.url, "_blank", "noopener,noreferrer");
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
          className={`${favorite ? "bg-rose-600 text-white" : "bg-primary/95 text-primary-foreground"} rounded-full shadow-sm p-1.5`}
          aria-label={favorite ? tGift("favorite") : "Dans la wishlist"}
        >
          <Heart className="w-3 h-3 fill-current" />
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        {offers.length > 0 && (
          <div className="px-3 pb-2 space-y-1.5">
            {offers.map((offer) => (
              <ShopOfferBadge
                key={offer.shop}
                shopName={offer.shopName}
                ariaLabel={
                  offer.discount > 0
                    ? tShop("badge.discount", { percent: offer.discount, shop: offer.shopName })
                    : tShop("badge.available", { shop: offer.shopName })
                }
                price={offer.price}
                compareAtPrice={offer.compareAtPrice}
                discount={offer.discount}
                sizeNote={offer.otherSizes.length > 0 ? tShop("otherSizes", { sizes: offer.otherSizes.join(", ") }) : undefined}
                onClick={handleOfferClick(offer)}
              />
            ))}
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
