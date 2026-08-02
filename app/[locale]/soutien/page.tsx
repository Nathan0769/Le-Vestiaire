import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  BadgeCheck,
  Camera,
  CircleUserRound,
  CreditCard,
  Crown,
  Heart,
  ImageIcon,
  TrendingUp,
} from "lucide-react";
import { SupporterPricing } from "@/components/supporter/supporter-pricing";
import { MemberGate } from "@/components/supporter/member-gate";
import { MembershipCard } from "@/components/supporter/membership-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pricing");
  const url = "https://le-vestiaire-foot.fr/soutien";
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url,
      siteName: "Le Vestiaire Foot",
      type: "website",
    },
    alternates: { canonical: url },
  };
}

export default async function SoutienPage() {
  const t = await getTranslations("Pricing");

  const features = [
    { icon: CreditCard, key: "card" },
    { icon: ImageIcon, key: "banner" },
    { icon: CircleUserRound, key: "frame" },
    { icon: BadgeCheck, key: "badge" },
    { icon: Camera, key: "photos" },
  ] as const;

  // Accentue les mots-clés dans les descriptions (balise <b> côté traduction).
  const bold = {
    b: (chunks: React.ReactNode) => (
      <strong className="font-semibold text-foreground">{chunks}</strong>
    ),
  };

  return (
    <MemberGate>
      <div className="mx-auto max-w-5xl px-4 py-12 space-y-16">
        {/* Hero + projet en une grille.
            Desktop : [pitch | carte] en haut, projet pleine largeur dessous.
            Mobile : pitch (1) -> projet (2) -> carte (3). */}
        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[1fr_minmax(0,400px)] lg:items-center">
          {/* Pitch */}
          <div className="order-1 lg:col-start-1 lg:row-start-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#c9a84c]">
              {t("eyebrow")}
            </p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{t("title")}</h1>
            <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
              {t.rich("heroPitch", bold)}
            </p>
            <a
              href="#tarifs"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#e6c766] px-6 py-3 font-semibold text-[#2a2008] shadow-[0_10px_30px_-12px_rgba(201,168,76,0.7)] transition hover:bg-[#eccd6a]"
            >
              <Crown className="h-4 w-4" />
              {t("heroCta")}
            </a>
            <p className="mt-2.5 text-xs text-muted-foreground">
              {t("heroCtaSub")}
            </p>
          </div>

          {/* Carte (mobile : 3e) */}
          <div className="order-3 flex justify-center lg:col-start-2 lg:row-start-1">
            <MembershipCard
              name="Ton pseudo"
              userId="apercu-le-vestiaire"
              jerseyCount={42}
              since={new Date().getFullYear()}
            />
          </div>

          {/* Projet (mobile : 2e ; desktop : pleine largeur sous le hero) */}
          <section className="order-2 flex items-start gap-4 rounded-2xl bg-rose-50 p-5 dark:bg-rose-950/20 lg:col-span-2 lg:row-start-2">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
              <Heart className="h-5 w-5 text-rose-500" fill="currentColor" />
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold">{t("independent.title")}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("independent.description")}
              </p>
            </div>
          </section>
        </div>

        {/* Ce que ça débloque */}
        <section className="space-y-5">
          <h2 className="text-center text-xl font-bold">{t("unlock.title")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {t(`features.${key}.title`)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.rich(`features.${key}.description`, bold)}
                  </p>
                </div>
              </div>
            ))}
            {/* Valeur marché : à venir */}
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 shadow-sm">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm font-medium">
                  {t("features.marketValue.title")}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {t("comingSoon")}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.rich("features.marketValue.description", bold)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tarifs */}
        <section id="tarifs" className="scroll-mt-8 space-y-5">
          <h2 className="text-center text-xl font-bold">{t("pricingTitle")}</h2>
          <SupporterPricing />
          <p className="text-center text-sm text-muted-foreground">
            {t("freeReminder")}
          </p>
        </section>
      </div>
    </MemberGate>
  );
}
