"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart2, TrendingUp, TrendingDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MarketValueDetail {
  invested: number;
  estimatedOnPriced: number;
  confidence: { high: number; medium: number; low: number };
  topJerseys: {
    clubName: string;
    jerseyName: string;
    season: string;
    value: number;
    confidence: string;
  }[];
  byClub: { clubName: string; value: number }[];
  byClubOther: number;
}

interface Props {
  estimatedMarketValue: number;
  marketValueCoverage: number;
  marketValueItems: number;
  detail: MarketValueDetail;
}

const eur = (n: number) =>
  `${Math.round(n).toLocaleString("fr-FR")} €`;

function Bar({
  label,
  sub,
  value,
  max,
  muted,
}: {
  label: string;
  sub?: string;
  value: number;
  max: number;
  muted?: boolean;
}) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 0;
  return (
    <div className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3">
      <div className="min-w-0">
        <p className="truncate text-[13px] leading-tight">{label}</p>
        {sub && (
          <p className="truncate text-[10.5px] text-muted-foreground">{sub}</p>
        )}
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${muted ? "bg-muted-foreground/50" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="min-w-[3.25rem] text-right text-[13px] font-semibold tabular-nums">
        {eur(value)}
      </span>
    </div>
  );
}

export function MarketValueCard({
  estimatedMarketValue,
  marketValueCoverage,
  marketValueItems,
  detail,
}: Props) {
  if (estimatedMarketValue <= 0) {
    return (
      <Card className="opacity-60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-2 text-sm font-medium">
            <span className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              Valeur marché
            </span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              Bientôt
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-muted-foreground">—</p>
          <p className="mt-1 text-xs text-muted-foreground">
            La cote estimée de ta collection arrive bientôt.
          </p>
        </CardContent>
      </Card>
    );
  }

  const gain = detail.estimatedOnPriced - detail.invested;
  const positive = gain >= 0;
  const gainPct =
    detail.invested > 0 ? Math.round((gain / detail.invested) * 100) : 0;
  const avg =
    marketValueItems > 0 ? estimatedMarketValue / marketValueItems : 0;
  const topMax = detail.topJerseys[0]?.value ?? 0;
  const clubMax = Math.max(
    detail.byClub[0]?.value ?? 0,
    detail.byClubOther ?? 0
  );

  const confTotal =
    detail.confidence.low + detail.confidence.medium + detail.confidence.high;
  const w = (n: number) => (confTotal > 0 ? (n / confTotal) * 100 : 0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer transition hover:border-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <BarChart2 className="h-4 w-4 text-primary" />
              Valeur marché
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{eur(estimatedMarketValue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Estimation · {marketValueCoverage}% des maillots · voir le détail
            </p>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Valeur de ta collection</DialogTitle>
          <DialogDescription>
            Estimation d&apos;après les prix d&apos;achat de nos collectionneurs
            et Classic Football Shirts. Valeur indicative, ajustée à
            l&apos;état — pas une cote officielle.
          </DialogDescription>
        </DialogHeader>

        {/* Hero */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
          <div>
            <p className="text-xs text-muted-foreground">Valeur estimée</p>
            <p className="text-4xl font-extrabold tracking-tight text-primary">
              {eur(estimatedMarketValue)}
            </p>
          </div>
          {detail.invested > 0 && (
            <div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${
                  positive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border border-red-500/40 text-red-500"
                }`}
              >
                {positive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {positive ? "+" : ""}
                {eur(gain)}
              </span>
              <p className="mt-1.5 text-xs text-muted-foreground">
                vs {eur(detail.invested)} investis · {positive ? "+" : ""}
                {gainPct}% (sur les maillots cotés que tu as payés)
              </p>
            </div>
          )}
        </div>

        {/* Tuiles KPI */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border bg-card p-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Maillots cotés
            </p>
            <p className="mt-1 text-xl font-bold">{marketValueItems}</p>
            <p className="text-[11px] text-muted-foreground">
              {marketValueCoverage}% de couverture
            </p>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Investi (cotés)
            </p>
            <p className="mt-1 text-xl font-bold">{eur(detail.invested)}</p>
            <p className="text-[11px] text-muted-foreground">maillots payés</p>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Plus-value estimée
            </p>
            <p
              className={`mt-1 text-xl font-bold ${
                positive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-500"
              }`}
            >
              {positive ? "+" : ""}
              {eur(gain)}
            </p>
            <p className="text-[11px] text-muted-foreground">estimée − investi</p>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Cote moyenne
            </p>
            <p className="mt-1 text-xl font-bold text-primary">{eur(avg)}</p>
            <p className="text-[11px] text-muted-foreground">par maillot coté</p>
          </div>
        </div>

        {/* Détail : top valeurs + (fiabilité / par club) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr]">
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold">Tes maillots les plus cotés</h3>
            <p className="mb-3 text-[11.5px] text-muted-foreground">
              Cote estimée par maillot (ajustée à l&apos;état).
            </p>
            <div className="flex flex-col gap-2.5">
              {detail.topJerseys.map((j, i) => (
                <Bar
                  key={i}
                  label={j.clubName}
                  sub={`${j.jerseyName} · ${j.season}`}
                  value={j.value}
                  max={topMax}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex-1 rounded-xl border bg-card p-4">
              <h3 className="text-sm font-semibold">
                Fiabilité de l&apos;estimation
              </h3>
              <p className="mb-3 text-[11.5px] text-muted-foreground">
                Selon le nombre de ventes derrière chaque cote.
              </p>
              <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full">
                <div
                  className="h-full bg-muted-foreground/50"
                  style={{ width: `${w(detail.confidence.low)}%` }}
                />
                <div
                  className="h-full bg-primary/50"
                  style={{ width: `${w(detail.confidence.medium)}%` }}
                />
                <div
                  className="h-full bg-primary"
                  style={{ width: `${w(detail.confidence.high)}%` }}
                />
              </div>
              <div className="mt-3 flex flex-col gap-2 text-[12.5px]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/50" />
                  Faible{" "}
                  <span className="text-muted-foreground">· 1 vente</span>
                  <span className="ml-auto font-bold text-muted-foreground">
                    {detail.confidence.low}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-primary/50" />
                  Indicative{" "}
                  <span className="text-muted-foreground">· 3-4 ventes</span>
                  <span className="ml-auto font-bold text-muted-foreground">
                    {detail.confidence.medium}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                  Fiable{" "}
                  <span className="text-muted-foreground">· 5+ ventes</span>
                  <span className="ml-auto font-bold text-muted-foreground">
                    {detail.confidence.high}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 rounded-xl border bg-card p-4">
              <h3 className="text-sm font-semibold">Où se concentre ta valeur</h3>
              <p className="mb-3 text-[11.5px] text-muted-foreground">
                Part de la cote totale par club.
              </p>
              <div className="flex flex-col gap-2.5">
                {detail.byClub.map((c, i) => (
                  <Bar
                    key={i}
                    label={c.clubName}
                    value={c.value}
                    max={clubMax}
                  />
                ))}
                {detail.byClubOther > 0 && (
                  <Bar
                    label="Autres clubs"
                    value={detail.byClubOther}
                    max={clubMax}
                    muted
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
