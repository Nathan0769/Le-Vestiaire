"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Shirt, Heart } from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface HeroSectionProps {
  user?: {
    id: string;
    email: string;
    name: string;
  } | null;
  userStats?: {
    collection: { total: number };
    wishlist: { total: number };
  } | null;
}

export function HeroSection({ user, userStats }: HeroSectionProps) {
  const t = useTranslations("HomePage.hero");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Le Vestiaire Foot - Votre Collection de Maillots de Football",
    description:
      "Découvrez, collectionnez et partagez votre passion pour les maillots de football. Créez votre collection personnelle et partagez la avec la communauté",
    url: "https://le-vestiaire-foot.fr",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://le-vestiaire-foot.fr/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section
        className="relative min-h-[70vh] flex items-center justify-center"
        role="banner"
        aria-label={t("ariaLabelBanner")}
      >
        <div className="absolute inset-0">
          <Image
            src="https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/logo-app/vestiaire.jpg"
            alt="Collection de maillots de football - Le Vestiaire"
            fill
            className="object-cover object-center"
            priority
            quality={85}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <header>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              {t("title")}{" "}
              <span className="text-primary block mt-2">{t("appName")}</span>
            </h1>

            <h2 className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("subtitle")}
            </h2>
          </header>

          {user && userStats ? (
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
              itemScope
              itemType="https://schema.org/Person"
            >
              <div
                className="flex items-center gap-6 bg-card/80 backdrop-blur-sm rounded-full px-6 py-4 border border-border/50"
                role="region"
                aria-label={t("ariaLabelStats")}
              >
                <div className="flex items-center gap-2 text-center">
                  <Shirt className="w-5 h-5 text-primary" aria-hidden="true" />
                  <div>
                    <div
                      className="text-2xl font-bold text-foreground"
                      itemProp="owns"
                      aria-label={t("ariaLabelCollectionCount", {
                        count: userStats.collection.total,
                      })}
                    >
                      {userStats.collection.total}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("myCollection")}
                    </div>
                  </div>
                </div>

                <div className="w-px h-8 bg-border/50" role="separator" />

                <div className="flex items-center gap-2 text-center">
                  <Heart className="w-5 h-5 text-red-500" aria-hidden="true" />
                  <div>
                    <div
                      className="text-2xl font-bold text-foreground"
                      aria-label={t("ariaLabelWishlistCount", {
                        count: userStats.wishlist.total,
                      })}
                    >
                      {userStats.wishlist.total}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("myWishlist")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <nav
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
              aria-label={t("ariaLabelAuth")}
            >
              <Button size="lg" asChild className="w-[200px] sm:w-auto">
                <Link href="/auth/login" className="gap-2 justify-center">
                  {t("login")}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-[200px] sm:w-auto"
              >
                <Link href="/auth/signUp" className="justify-center">
                  {t("signup")}
                </Link>
              </Button>
            </nav>
          )}

          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              asChild
              className="text-muted-foreground hover:text-primary"
            >
              <Link href="/jerseys" className="gap-2">
                {t("discoverJerseys")}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
