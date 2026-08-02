"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Camera,
  CircleUserRound,
  CreditCard,
  ExternalLink,
  ImageIcon,
  Info,
  Loader2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ShareableCard } from "@/components/supporter/shareable-card";
import { SupporterBadge } from "@/components/supporter/supporter-badge";
import { CosmeticsSettings } from "@/components/settings/cosmetics-settings";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

interface MemberAreaProps {
  name: string;
  userId: string;
  jerseyCount?: number;
  since: number;
}

const fmtMonthYear = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat("fr-FR", {
        month: "long",
        year: "numeric",
      }).format(new Date(iso))
    : null;

const fmtDate = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(iso))
    : null;

const fmtPrice = (amount?: number | null, currency?: string) =>
  amount != null
    ? new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: (currency ?? "eur").toUpperCase(),
      }).format(amount / 100)
    : null;

/**
 * Espace membre du Cercle Supporter (sur /soutien pour un supporter connecté) :
 * en-tête, carte partageable + actions, statut d'adhésion réel (Stripe),
 * avantages actifs et personnalisation des cosmétiques.
 */
export function MemberArea({
  name,
  userId,
  jerseyCount,
  since,
}: MemberAreaProps) {
  const t = useTranslations("Pricing");
  const { subscription, loading: subLoading } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      if (data.url) window.location.href = data.url;
    } catch {
      setPortalLoading(false);
    }
  };

  const perks: { icon: LucideIcon; key: string; coming?: boolean }[] = [
    { icon: CreditCard, key: "card" },
    { icon: ImageIcon, key: "banner" },
    { icon: CircleUserRound, key: "frame" },
    { icon: BadgeCheck, key: "badge" },
    { icon: Camera, key: "photos" },
    { icon: TrendingUp, key: "marketValue", coming: true },
  ];

  const isStripe = subscription?.source === "stripe";
  const planLabel = isStripe
    ? [
        subscription?.interval === "year"
          ? t("member.yearly")
          : t("member.monthly"),
        fmtPrice(subscription?.amount, subscription?.currency),
      ]
        .filter(Boolean)
        .join(" · ")
    : t("member.comp");
  const renewalDate = fmtDate(subscription?.currentPeriodEnd);
  const memberSince =
    fmtMonthYear(subscription?.since) ?? String(since);
  // La carte affiche l'année d'adhésion au Cercle, cohérente avec le panneau.
  const cardSince = subscription?.since
    ? new Date(subscription.since).getFullYear()
    : since;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-10">
      {/* En-tête */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#c9a84c]">
            {t("member.eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight break-words sm:text-4xl">
            {t("member.title")},{" "}
            <span className="font-serif italic text-[#a9852c] dark:text-[#e7ce86]">
              {name}
            </span>
            .
          </h1>
          <p className="mt-2 max-w-[46ch] text-[15px] text-muted-foreground">
            {t("member.subtitle")}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-amber-300/70 bg-amber-50 px-3.5 py-1.5 dark:border-amber-500/25 dark:bg-amber-500/10">
          <SupporterBadge size="lg" />
        </span>
      </header>

      {/* Héros : carte + actions | adhésion */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-start">
        <ShareableCard
          name={name}
          userId={userId}
          jerseyCount={jerseyCount}
          since={cardSince}
        >
          <Button
            onClick={handleManage}
            disabled={portalLoading}
            variant="outline"
            className="flex-1 cursor-pointer"
          >
            {portalLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="mr-2 h-4 w-4" />
            )}
            {t("member.manage")}
          </Button>
        </ShareableCard>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("member.membership")}
          </h2>
          <dl className="text-sm">
            <Row label={t("member.statusLabel")}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t("member.active")}
              </span>
            </Row>
            <Row label={t("member.plan")} loading={subLoading}>
              {planLabel}
            </Row>
            {renewalDate && (
              <Row
                label={
                  subscription?.cancelAtPeriodEnd
                    ? t("member.ends")
                    : t("member.renewal")
                }
                loading={subLoading}
              >
                {renewalDate}
              </Row>
            )}
            <Row label={t("member.since")} loading={subLoading}>
              {memberSince}
            </Row>
          </dl>
        </section>
      </div>

      {/* Avantages actifs */}
      <section>
        <h2 className="text-[15px] font-semibold tracking-tight">
          {t("member.perksTitle")}
        </h2>
        <p className="mt-1 mb-4 text-[13px] text-muted-foreground">
          {t("member.perksHint")}
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {perks.map(({ icon: Icon, key, coming }) => (
            <div
              key={key}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border border-border p-3.5 text-center",
                coming ? "bg-muted/30" : "bg-card"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  coming
                    ? "bg-muted text-muted-foreground"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                )}
              >
                <Icon className="h-[17px] w-[17px]" />
              </span>
              <span className="text-xs font-semibold leading-tight">
                {t(`features.${key}.title`)}
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wide",
                  coming
                    ? "text-muted-foreground"
                    : "text-emerald-600 dark:text-emerald-500"
                )}
              >
                {coming ? t("comingSoon") : t("member.active")}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Cosmétiques */}
      <section>
        <h2 className="text-[15px] font-semibold tracking-tight">
          {t("member.customize")}
        </h2>
        <p className="mt-1 mb-4 text-[13px] text-muted-foreground">
          {t("member.customizeHint")}
        </p>
        <CosmeticsSettings bare />
      </section>

      <p className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-4 text-[13px] text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 flex-none text-[#c9a84c]" />
        {t("member.cancelNote")}
      </p>
    </div>
  );
}

function Row({
  label,
  loading,
  children,
}: {
  label: string;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-t border-border py-2.5 first:border-t-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-semibold tabular-nums", loading && "opacity-40")}>
        {loading ? "…" : children}
      </dd>
    </div>
  );
}
