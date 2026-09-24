"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart2, ChevronRight, Lock, Check } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const eur = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;
const GOLD = "text-[oklch(0.66_0.11_88)] dark:text-[oklch(0.82_0.11_90)]";
const GOLD_HEX = "oklch(0.72 0.115 90)";

// Autres avantages Supporter, repris de Pricing.features (déjà traduits).
const OTHER_PERK_KEYS = ["badge", "frame", "banner", "photos"];

export function MarketValueCard() {
  const t = useTranslations("MarketValue");
  const tPricing = useTranslations("Pricing");
  const user = useCurrentUser();
  const isSupporter = !!user?.isSupporter;
  const [showPaywall, setShowPaywall] = useState(false);

  const { data } = useQuery<{ summary: { estimated: number; gain: number; gainPct: number } }>({
    queryKey: ["collection-value"],
    queryFn: async () => {
      const res = await fetch("/api/user/collection-value");
      if (!res.ok) throw new Error("Failed to fetch value");
      return res.json();
    },
    enabled: isSupporter, // on n'appelle pas l'API (403) pour les non-Supporters
  });

  const estimated = data?.summary.estimated ?? 0;

  // Non-Supporter : aperçu flouté (aucune vraie valeur reçue) + pop-up premium.
  if (!isSupporter) {
    return (
      <>
        <button type="button" onClick={() => setShowPaywall(true)} className="block w-full text-left">
          <Card className="cursor-pointer transition hover:border-primary/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-2 text-sm font-medium">
                <span className="flex items-center gap-2">
                  <BarChart2 className={`h-4 w-4 ${GOLD}`} />
                  {t("cardLabel")}
                </span>
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`select-none text-2xl font-bold tabular-nums blur-[6px] ${GOLD}`}>
                1 250 €
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t("cardLocked")}</p>
            </CardContent>
          </Card>
        </button>

        <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
          <DialogContent className="overflow-hidden p-0 sm:max-w-md">
            {/* Bannière teaser : aperçu flouté de la valeur + mini-courbe or */}
            <div className="relative overflow-hidden border-b bg-[oklch(0.72_0.115_90)]/10 px-6 pt-7 pb-6">
              <svg
                viewBox="0 0 320 70"
                preserveAspectRatio="none"
                className="absolute inset-x-0 bottom-0 h-16 w-full opacity-60"
                aria-hidden
              >
                <defs>
                  <linearGradient id="pw-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD_HEX} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={GOLD_HEX} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,58 C50,54 70,44 110,42 C150,40 170,24 210,18 C250,12 280,8 320,4 L320,70 L0,70 Z"
                  fill="url(#pw-fill)"
                />
                <path
                  d="M0,58 C50,54 70,44 110,42 C150,40 170,24 210,18 C250,12 280,8 320,4"
                  fill="none"
                  stroke={GOLD_HEX}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <div className="relative text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("title")}
                </p>
                <p className={`mt-1 select-none text-4xl font-extrabold tabular-nums blur-[7px] ${GOLD}`}>
                  2 341 €
                </p>
              </div>
              <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur">
                <Lock className="h-3 w-3" /> {t("supporterPill")}
              </span>
            </div>

            <div className="px-6 pb-6 pt-4">
              <DialogHeader>
                <DialogTitle className="text-xl">{t("paywallTitle")}</DialogTitle>
                <DialogDescription>{t("paywallDesc")}</DialogDescription>
              </DialogHeader>

              <ul className="mt-4 space-y-2.5">
                {[1, 2, 3].map((n) => (
                  <li key={n} className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[oklch(0.72_0.115_90)]/12 ${GOLD}`}>
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className="text-sm text-foreground">{t(`perk${n}`)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 rounded-xl border border-dashed p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("otherIncluded")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {OTHER_PERK_KEYS.map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                    >
                      <Check className={`h-3 w-3 ${GOLD}`} strokeWidth={3} />
                      {tPricing(`features.${k}.title`)}
                    </span>
                  ))}
                </div>
              </div>

              <Button asChild className="mt-5 w-full">
                <Link href="/soutien">{t("cta")}</Link>
              </Button>
              <button
                type="button"
                onClick={() => setShowPaywall(false)}
                className="mt-2 w-full text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("later")}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (estimated <= 0) {
    return (
      <Card className="opacity-60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
            {t("cardLabel")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-muted-foreground">—</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("cardComingSoon")}</p>
        </CardContent>
      </Card>
    );
  }

  const positive = (data?.summary.gain ?? 0) >= 0;

  // Supporter : card cliquable vers le détail.
  return (
    <Link href="/collection/stats/valeur" className="block">
      <Card className="cursor-pointer transition hover:border-primary/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-2 text-sm font-medium">
            <span className="flex items-center gap-2">
              <BarChart2 className={`h-4 w-4 ${GOLD}`} />
              {t("cardLabel")}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold tabular-nums ${GOLD}`}>{eur(estimated)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data?.summary.gain != null && data.summary.gain !== 0 ? (
              <span
                className={
                  positive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }
              >
                {positive ? "+" : ""}
                {eur(data.summary.gain)} ({positive ? "+" : ""}
                {data.summary.gainPct}%)
              </span>
            ) : (
              t("cardEstimation")
            )}{" "}
            · {t("seeDetail")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
