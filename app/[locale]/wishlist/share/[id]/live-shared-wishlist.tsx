"use client";

import { useMemo, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Gift, Heart, Lock } from "lucide-react";
import type { JerseyType, JerseyVersion } from "@prisma/client";
import type { PublicShare } from "@/lib/wishlist-shares";
import { THEME_PAGE_CONFIG } from "@/lib/theme";
import { formatMoney } from "@/lib/format-money";
import { translateJerseyName } from "@/lib/translate-jersey-name";
import { jerseyTypeLabel } from "@/lib/jersey-utils";
import { Badge } from "@/components/ui/badge";
import { GiftReservationButton, giftTokenKey, readGiftToken } from "@/components/wishlist/gift-reservation-button";

function subscribeStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/** Jetons « je l'offre » de ce navigateur pour ce partage, et ceux d'envies disparues (retirées ou reçues). */
function readLocalGifts(share: PublicShare): string {
  const tokens: Record<string, string> = {};
  for (const item of share.items) {
    const token = readGiftToken(share.id, item.wishlistId);
    if (token) tokens[item.wishlistId] = token;
  }
  let goneCount = 0;
  try {
    const prefix = `gift:${share.id}:`;
    const present = new Set(share.items.map((i) => giftTokenKey(share.id, i.wishlistId)));
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix) && !present.has(key)) goneCount += 1;
    }
  } catch {
    // Stockage bloqué : pas d'avertissement possible, la page reste utilisable.
  }
  return JSON.stringify({ tokens, goneCount });
}

/** Page d'un partage vivant : infos cadeau, meilleures offres et « je l'offre ». */
export default function LiveSharedWishlist({ share }: { share: PublicShare }) {
  const locale = useLocale();
  const t = useTranslations("Wishlist.liveShare");
  const tType = useTranslations("JerseyType");
  const tVersion = useTranslations("JerseyVersion");
  const config = THEME_PAGE_CONFIG[share.theme] ?? THEME_PAGE_CONFIG.default;

  // Jetons locaux de ce navigateur. Snapshot sérialisé (stable entre deux lectures),
  // null au rendu serveur où localStorage n'existe pas.
  const snapshot = useSyncExternalStore(
    subscribeStorage,
    () => readLocalGifts(share),
    () => null
  );
  const { tokens, goneCount } = useMemo(() => {
    if (snapshot === null) return { tokens: null, goneCount: 0 };
    return JSON.parse(snapshot) as { tokens: Record<string, string>; goneCount: number };
  }, [snapshot]);

  const nameOf = (item: PublicShare["items"][number]) =>
    translateJerseyName({
      jersey: {
        name: item.jersey.name,
        type: item.jersey.type as JerseyType,
        season: item.jersey.season,
        clubShortName: item.jersey.club.shortName,
      },
      locale,
      typeTranslation: jerseyTypeLabel(tType(item.jersey.type as JerseyType), item.jersey.type as JerseyType, item.jersey.variant),
    });

  const flockOf = (item: PublicShare["items"][number]) =>
    [item.flockName, item.flockNumber].filter((v) => v !== null && v !== "").join(" ");

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.gradient}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <header className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            {share.owner.avatarUrl ? (
              <Image
                src={share.owner.avatarUrl}
                alt=""
                width={32}
                height={32}
                className="rounded-full object-cover w-8 h-8"
                unoptimized
              />
            ) : (
              <span className={`w-8 h-8 rounded-full bg-gradient-to-br ${config.headerGradient} flex items-center justify-center`}>
                <Gift className="w-4 h-4 text-white" />
              </span>
            )}
            {share.owner.username && <span className="font-medium">@{share.owner.username}</span>}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight">{share.title}</h1>
          {share.message && <p className="max-w-2xl mx-auto text-lg text-gray-600 leading-relaxed">{share.message}</p>}
          <Badge variant="outline" className="bg-white/60 text-gray-800 border-gray-300">
            {t("jerseyCount", { count: share.items.length })}
          </Badge>
        </header>

        {share.viewerIsOwner && (
          <div className="flex items-center gap-2 rounded-xl bg-white/80 border border-gray-200 px-4 py-3 text-sm text-gray-700">
            <Lock className="w-4 h-4 shrink-0" />
            {t("ownerHidden")}
          </div>
        )}

        {goneCount > 0 && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
            {t("goneNotice", { count: goneCount })}
          </div>
        )}

        {share.items.length === 0 ? (
          <p className="text-center text-gray-600 py-12">{t("empty")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {share.items.map((item) => {
              const best = item.offers[0];
              const flock = flockOf(item);
              return (
                <article
                  key={item.wishlistId}
                  className={`rounded-2xl bg-white/90 border ${config.cardBorder} p-4 space-y-3 flex flex-col`}
                >
                  <div className="relative aspect-square rounded-xl bg-white overflow-hidden">
                    <Image src={item.jersey.imageUrl} alt={nameOf(item)} fill className="object-contain" unoptimized />
                    {item.favorite && (
                      <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-rose-600 text-white text-[11px] font-semibold px-2 py-1">
                        <Heart className="w-3 h-3 fill-current" /> {t("favorite")}
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="font-bold text-gray-800">{item.jersey.club.name}</h2>
                    <p className="text-sm text-gray-600">{nameOf(item)}</p>
                  </div>

                  {(item.size || item.version || flock) && (
                    <dl className="flex flex-wrap gap-1.5 text-xs text-gray-800">
                      {item.size && (
                        <div className="rounded-md bg-gray-100 px-2 py-1">
                          <dt className="sr-only">{t("size")}</dt>
                          <dd>{t("sizeValue", { size: item.size })}</dd>
                        </div>
                      )}
                      {item.version && (
                        <div className="rounded-md bg-gray-100 px-2 py-1">
                          <dt className="sr-only">{t("version")}</dt>
                          <dd>{tVersion(item.version as JerseyVersion)}</dd>
                        </div>
                      )}
                      {flock && (
                        <div className="rounded-md bg-gray-100 px-2 py-1">
                          <dt className="sr-only">{t("flock")}</dt>
                          <dd>{t("flockValue", { flock })}</dd>
                        </div>
                      )}
                    </dl>
                  )}

                  <div className="mt-auto space-y-2">
                    {best && (
                      <a
                        href={best.url}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                      >
                        <span className="flex items-baseline gap-1.5">
                          <span className="font-bold text-gray-900">{formatMoney(best.price, "EUR", locale)}</span>
                          {best.compareAtPrice !== null && (
                            <span className="text-xs text-gray-500 line-through">
                              {formatMoney(best.compareAtPrice, "EUR", locale)}
                            </span>
                          )}
                          <span className="text-xs text-gray-600">
                            {t("at", { shop: best.shopName })}
                            {best.otherSizes.length > 0 && ` · ${t("otherSizes", { sizes: best.otherSizes.join(", ") })}`}
                          </span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                      </a>
                    )}
                    {!share.viewerIsOwner && tokens !== null && (
                      <GiftReservationButton
                        key={`${item.wishlistId}-${tokens[item.wishlistId] ?? ""}`}
                        shareId={share.id}
                        wishlistId={item.wishlistId}
                        reservedBy={item.reservedBy}
                        initialToken={tokens[item.wishlistId] ?? null}
                        buttonClassName={config.button}
                      />
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <footer className="text-center text-sm text-gray-600 pt-6">
          <Link href="/" className="underline cursor-pointer">
            {t("createdWith")}
          </Link>
        </footer>
      </div>
    </div>
  );
}
