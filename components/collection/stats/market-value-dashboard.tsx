"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Loader2, Package, ChevronDown } from "lucide-react";
import { MarketValueChart } from "./market-value-chart";

interface Row {
  id: string;
  clubName: string;
  jerseyName: string;
  season: string;
  type: string;
  version: string;
  condition: string;
  imageUrl: string;
  value: number | null;
  source: "market" | "purchase" | "unknown";
  confidence: string | null;
  addedAt: string;
}

interface ValueResponse {
  summary: {
    estimated: number;
    count: number;
    invested: number;
    currentValuePriced: number;
    gain: number;
    gainPct: number;
    pricedCount: number;
    avg: number;
  };
  rows: Row[];
}

const eur = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

type Sort = "value" | "recent" | "club";

export function MarketValueDashboard() {
  const [sort, setSort] = useState<Sort>("value");
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations("MarketValue");
  const tType = useTranslations("JerseyType");
  const tVersion = useTranslations("JerseyVersion");
  const tCondition = useTranslations("Condition");

  const confLabel = (source: string, confidence: string | null) => {
    if (source === "purchase") return t("confPurchase");
    if (confidence === "high") return t("confHigh");
    if (confidence === "medium") return t("confMedium");
    return t("confIndicative");
  };

  const { data, isLoading } = useQuery<ValueResponse>({
    queryKey: ["collection-value"],
    queryFn: async () => {
      const res = await fetch("/api/user/collection-value");
      if (!res.ok) throw new Error("Failed to fetch value");
      return res.json();
    },
  });

  const rows = useMemo(() => {
    const r = [...(data?.rows ?? [])];
    if (sort === "value") r.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    else if (sort === "recent")
      r.sort((a, b) => +new Date(b.addedAt) - +new Date(a.addedAt));
    else r.sort((a, b) => a.clubName.localeCompare(b.clubName));
    return r;
  }, [data, sort]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const s = data?.summary;
  if (!s || s.count === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Package className="mb-4 h-14 w-14 text-muted-foreground/30" />
        <h2 className="mb-1 text-lg font-medium text-muted-foreground">{t("emptyTitle")}</h2>
        <p className="max-w-md text-sm text-muted-foreground">{t("emptyText")}</p>
      </div>
    );
  }

  const positive = s.gain >= 0;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero */}
      <div className="py-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("title")}
        </p>
        <p className="mt-3 text-5xl font-extrabold tracking-tight tabular-nums text-[oklch(0.66_0.11_88)] dark:text-[oklch(0.82_0.11_90)] sm:text-6xl">
          {eur(s.estimated)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle", { count: s.count })}</p>
      </div>

      {/* Chart */}
      <MarketValueChart />

      {/* Performance — périmètre cohérent (maillots au prix connu) */}
      {s.pricedCount > 0 && (
        <>
          <div className="mt-3.5 grid grid-cols-3 overflow-hidden rounded-2xl border bg-card">
            <div className="border-r p-4 md:px-5">
              <p className="text-[11px] font-medium text-muted-foreground">{t("invested")}</p>
              <p className="mt-1 text-lg font-bold tabular-nums md:text-xl">{eur(s.invested)}</p>
            </div>
            <div className="border-r p-4 md:px-5">
              <p className="text-[11px] font-medium text-muted-foreground">{t("currentValue")}</p>
              <p className="mt-1 text-lg font-bold tabular-nums md:text-xl">
                {eur(s.currentValuePriced)}
              </p>
            </div>
            <div className="p-4 md:px-5">
              <p className="text-[11px] font-medium text-muted-foreground">{t("gain")}</p>
              <p
                className={`mt-1 flex items-baseline gap-1.5 text-lg font-bold tabular-nums md:text-xl ${
                  positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                {positive ? "+" : ""}
                {eur(s.gain)}
                <span className="text-xs font-semibold">
                  ({positive ? "+" : ""}
                  {s.gainPct}%)
                </span>
              </p>
            </div>
          </div>
          <p className="mt-2 px-1 text-[11px] text-muted-foreground">
            {t("perfNote", { count: s.pricedCount })}
          </p>
        </>
      )}

      {/* Table */}
      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-base font-bold">{t("tableTitle")}</h2>
        <div className="flex gap-0.5 rounded-lg border bg-card p-0.5">
          {(
            [
              ["value", t("sortValue")],
              ["recent", t("sortRecent")],
              ["club", t("sortClub")],
            ] as [Sort, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                sort === key
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        {(expanded ? rows : rows.slice(0, 6)).map((r, i) => (
          <div
            key={r.id}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 transition hover:bg-muted/50 md:px-4 ${
              i > 0 ? "border-t" : ""
            }`}
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.imageUrl}
                alt={r.clubName}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{r.clubName}</p>
              <p className="truncate text-[11.5px] text-muted-foreground">
                {r.season} · {tType(r.type)} · {tCondition(r.condition)}
              </p>
            </div>
            <span className="hidden shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-block">
              {tVersion(r.version)}
            </span>
            <div className="hidden w-24 shrink-0 items-center gap-1.5 text-[11.5px] text-muted-foreground md:flex">
              <ConfDot source={r.source} confidence={r.confidence} />
              <span className="truncate">{confLabel(r.source, r.confidence)}</span>
            </div>
            <span
              className={`w-[74px] shrink-0 text-right text-[15px] font-bold tabular-nums ${
                r.source === "purchase" ? "text-muted-foreground" : ""
              }`}
            >
              {r.value != null ? eur(r.value) : "—"}
            </span>
          </div>
        ))}
        {rows.length > 6 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-center gap-1.5 border-t py-3 text-sm font-semibold text-primary transition-colors hover:bg-muted/50"
          >
            {expanded ? t("seeLess") : t("seeMore", { count: rows.length - 6 })}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">{t("note")}</p>
    </div>
  );
}

function ConfDot({ source, confidence }: { source: string; confidence: string | null }) {
  const color =
    source === "purchase"
      ? "bg-muted-foreground/40"
      : confidence === "high"
        ? "bg-emerald-500"
        : confidence === "medium"
          ? "bg-amber-500"
          : "bg-muted-foreground/50";
  return <span className={`h-2 w-2 rounded-full ${color}`} />;
}
