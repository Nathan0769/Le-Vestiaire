import type { CountEntry, SignupSourcesSummary } from "@/lib/signup-attribution";

const percentFormat = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0 });

const CHANNEL_LABELS: Record<string, string> = {
  search: "Moteur de recherche",
  social: "Réseau social",
  other_site: "Autre site",
  direct: "Direct",
  app: "App iOS",
  unknown: "Inconnu",
};

const CHANNEL_COLORS: Record<string, string> = {
  search: "var(--chart-1)",
  social: "var(--chart-2)",
  other_site: "var(--chart-3)",
  direct: "var(--chart-4)",
  app: "var(--chart-5)",
  unknown: "var(--muted-foreground)",
};

const PAGE_LABELS: Record<string, string> = {
  jersey: "Fiche maillot",
  club: "Page club",
  catalog: "Catalogue",
  home: "Accueil",
  profile: "Profil public",
  shared_wishlist: "Wishlist partagée",
  auth: "Page d'inscription",
  other: "Autre",
};

function channelLabel(key: string) {
  if (key.startsWith("ref:")) return `Lien « ${key.slice(4)} »`;
  return CHANNEL_LABELS[key] ?? key;
}

function channelColor(key: string) {
  return key.startsWith("ref:") ? "var(--primary)" : (CHANNEL_COLORS[key] ?? "var(--chart-3)");
}

function CountTable({ title, entries, label }: { title: string; entries: CountEntry[]; label: (k: string) => string }) {
  const total = entries.reduce((sum, e) => sum + e.count, 0);
  return (
    <div className="min-w-0 space-y-2">
      <h4 className="text-sm font-medium">{title}</h4>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune donnée.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {entries.map((e) => (
            <li key={e.key} className="flex items-baseline justify-between gap-3">
              <span className="truncate text-muted-foreground" title={e.key}>
                {label(e.key)}
              </span>
              <span className="shrink-0 tabular-nums">
                <span className="font-semibold">{e.count}</span>{" "}
                <span className="text-xs text-muted-foreground">{percentFormat.format(e.count / total)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Barre empilée par canal, puis pages d'arrivée (type et chemins les plus fréquents). */
export function SignupSources({ summary }: { summary: SignupSourcesSummary }) {
  const { total, channels, pages, topPaths } = summary;

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Aucune inscription sur la période.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {channels.map(({ key, count }) => (
            <div key={key} style={{ width: `${(count / total) * 100}%`, backgroundColor: channelColor(key) }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {channels.map(({ key, count }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: channelColor(key) }} />
              <span className="text-muted-foreground">{channelLabel(key)}</span>
              <span className="font-semibold tabular-nums">{count}</span>
              <span className="text-xs text-muted-foreground">{percentFormat.format(count / total)}</span>
            </div>
          ))}
          <div className="text-muted-foreground">
            Total <span className="font-semibold text-foreground tabular-nums">{total}</span>
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <CountTable title="Type de page d'arrivée" entries={pages} label={(k) => PAGE_LABELS[k] ?? k} />
        <CountTable title="Pages d'arrivée les plus fréquentes" entries={topPaths} label={(k) => k} />
      </div>
    </div>
  );
}
