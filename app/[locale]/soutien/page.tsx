import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  BadgeCheck,
  CircleUserRound,
  CreditCard,
  Heart,
  ImageIcon,
  TrendingUp,
} from "lucide-react";
import { SupporterPricing } from "@/components/supporter/supporter-pricing";
import { SupporterBadge } from "@/components/supporter/supporter-badge";
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
  ] as const;

  return (
    <MemberGate>
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-12">
      {/* Hero */}
      <header className="text-center space-y-3">
        <div className="flex justify-center">
          <SupporterBadge size="lg" />
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </header>

      {/* Aperçu de la carte de membre — la récompense, en héros */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-full max-w-[420px] -rotate-2 transition-transform hover:rotate-0">
          <MembershipCard name="Ton pseudo" userId="apercu-le-vestiaire" since={new Date().getFullYear()} />
        </div>
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {t("cardTeaser")}
        </p>
      </div>

      {/* Projet indépendant / soutien créateur */}
      <section className="rounded-xl border bg-muted/30 p-6">
        <div className="flex items-start gap-3">
          <Heart className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" />
          <div className="space-y-1">
            <p className="font-semibold">{t("independent.title")}</p>
            <p className="text-sm text-muted-foreground">
              {t("independent.description")}
            </p>
          </div>
        </div>
      </section>

      {/* Ce que ça débloque */}
      <section className="space-y-5">
        <h2 className="text-center text-xl font-bold">{t("unlock.title")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="flex items-start gap-3 rounded-lg border p-4"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {t(`features.${key}.title`)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(`features.${key}.description`)}
                </p>
              </div>
            </div>
          ))}
          {/* Valeur marché : à venir */}
          <div className="flex items-start gap-3 rounded-lg border border-dashed p-4">
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
                {t("features.marketValue.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <SupporterPricing />

      {/* Rappel : rien n'est retiré au gratuit */}
      <p className="text-center text-sm text-muted-foreground">
        {t("freeReminder")}
      </p>
      </div>
    </MemberGate>
  );
}
