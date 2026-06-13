"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CFS_CLEARANCE_URL } from "@/lib/cfs-affiliate";
import { TRANSLATION_ORDER, translateJerseyName, type TermKey } from "@/lib/cfs-translate";

const INITIAL_VISIBLE = 6;

interface CfsPromo {
  id: string;
  name: string;
  imageUrl: string;
  price: string;
  promoPrice: string;
  affiliateUrl: string;
  club: string | null;
  brand: string | null;
  source: string;
  sizes: string[];
}

interface CfsPromoSectionProps {
  promos: CfsPromo[];
}

export function CfsPromoSection({ promos }: CfsPromoSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations("HomePage.cfsPromos");
  const terms: Record<TermKey, string> = {
    "Authentic Home Shirt": t("terms.Authentic Home Shirt"),
    "Authentic Away Shirt": t("terms.Authentic Away Shirt"),
    "Authentic Third Shirt": t("terms.Authentic Third Shirt"),
    "Authentic Fourth Shirt": t("terms.Authentic Fourth Shirt"),
    "Player Issue Home Shirt": t("terms.Player Issue Home Shirt"),
    "Player Issue Away Shirt": t("terms.Player Issue Away Shirt"),
    "Player Issue Third Shirt": t("terms.Player Issue Third Shirt"),
    "Home Shirt": t("terms.Home Shirt"),
    "Away Shirt": t("terms.Away Shirt"),
    "Third Shirt": t("terms.Third Shirt"),
    "Fourth Shirt": t("terms.Fourth Shirt"),
    "Anniversary Shirt": t("terms.Anniversary Shirt"),
    "Player Issue": t("terms.Player Issue"),
    "In Box": t("terms.In Box"),
    "L/S": t("terms.L/S"),
    Authentic: t("terms.Authentic"),
    Anniversary: t("terms.Anniversary"),
    Fourth: t("terms.Fourth"),
    Third: t("terms.Third"),
    Away: t("terms.Away"),
    Home: t("terms.Home"),
    Shirt: t("terms.Shirt"),
  };

  if (promos.length === 0) return null;

  const visible = expanded ? promos : promos.slice(0, INITIAL_VISIBLE);
  const hasMore = promos.length > INITIAL_VISIBLE;

  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
          {visible.map((promo) => {
            const price = parseFloat(promo.price);
            const promoPrice = parseFloat(promo.promoPrice);
            const discount = Math.round(((price - promoPrice) / price) * 100);
            const isWeeklyDeal = promo.source === "cfs-weekly-deals";
            const targetSizes = promo.sizes
              .filter((s) => ["S", "M", "L", "XL"].includes(s))
              .sort((a, b) => ["S", "M", "L", "XL"].indexOf(a) - ["S", "M", "L", "XL"].indexOf(b));

            return (
              <a
                key={promo.id}
                href={promo.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="group relative"
              >
                <div className="relative">
                  {discount > 0 && (
                    <div className="absolute -top-2 -right-2 z-10 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      -{discount}%
                    </div>
                  )}
                  {isWeeklyDeal && (
                    <div className="absolute -top-2 -left-2 z-10 bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      Deal
                    </div>
                  )}

                  <div className="aspect-square bg-white rounded-lg border border-border overflow-hidden mb-3 group-hover:shadow-lg transition-all duration-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={promo.imageUrl}
                      alt={promo.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {translateJerseyName(promo.name, terms)}
                    </h3>

                    {(promo.club || promo.brand) && (
                      <p className="text-xs text-muted-foreground">
                        {[promo.club, promo.brand].filter(Boolean).join(" • ")}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground line-through">
                        {price.toFixed(2)} €
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {promoPrice.toFixed(2)} €
                      </span>
                    </div>

                    {targetSizes.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {targetSizes.join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-3">
          {hasMore && (
            <Button
              variant="outline"
              onClick={() => setExpanded((e) => !e)}
              className="mb-1"
            >
              {expanded ? t("showLess") : t("showMore", { count: promos.length - INITIAL_VISIBLE })}
            </Button>
          )}
          <Button asChild className="gap-2">
            <a
              href={CFS_CLEARANCE_URL}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              {t("cta")}
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">{t("partnerNotice")}</p>
        </div>
      </div>
    </section>
  );
}
