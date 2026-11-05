import type { Condition } from "@/lib/market-value/types";

/**
 * API de recherche de Classic Football Shirts (Constructor.io), partagée par le
 * scrape des promos et celui des dispos. La clé est lisible en clair sur leur
 * site et change sans préavis (incident du 2026-08-24) : une seule constante.
 * Spec : docs/specs/2026-11-02-cfs-catalogue-complet.md.
 */
export const CFS_API_KEY = "key_gafGDajYFUpadvrp";
export const CFS_BROWSE_BASE = "https://ac.cnstrc.com/browse";

const PAGE_SIZE = 200;
/** L'API ne pagine pas au-delà de 10 000 résultats par requête. */
export const PAGE_CAP = 10_000;

// Filtres côté API : maillots de match adultes seulement (pas de training,
// vestes, sweats, polos, shorts, tailles enfant ni maillots portés en match).
const JERSEY_STYLES = ["Home", "Away", "Third", "Fourth", "GK"];
const ADULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
const DEPARTMENTS = ["Classic", "Clearance", "Current Season", "Own Brand"];
const ERAS = ["1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];

export interface CfsRawItem {
  data: {
    id?: string;
    name: string;
    url: string;
    image_url?: string | null;
    price_eur?: number | null;
    special_price_eur?: number | null;
    price_gbp?: number | null;
    special_price_gbp?: number | null;
    prodcat?: string | null;
    sleeve_length?: string | null;
    size_product?: (string | number)[] | string | number | null;
    /** Champ caché ("1"/"True" ou "0"/"False"), renvoyé avec show_hidden_fields. */
    in_stock?: string | boolean | null;
  };
  variations?: {
    data: { size_product?: (string | number)[] | string | number | null; in_stock?: string | boolean | null };
  }[];
}

export interface CfsItem {
  /** Identifiant CFS (data.id) ; le lien produit à défaut. */
  cfsId: string;
  name: string;
  url: string;
  imageUrl: string | null;
  price: number | null;
  promoPrice: number | null;
  /** Prix en livres : base du prix affiché par le site (lib/cfs-price.ts). */
  priceGbp: number | null;
  promoPriceGbp: number | null;
  condition: Condition | null;
  longSleeve: boolean;
  /** Tailles adultes proposées, en stock ou non. */
  sizes: string[];
  /** Tailles adultes en stock. */
  inStockSizes: string[];
}

export function buildBrowseUrl(input: { team: string; style: string; era?: string; page: number }): string {
  const url = new URL(`${CFS_BROWSE_BASE}/team/${encodeURIComponent(input.team)}`);
  url.searchParams.set("key", CFS_API_KEY);
  url.searchParams.set("num_results_per_page", String(PAGE_SIZE));
  url.searchParams.set("page", String(input.page));
  // L'API renvoie aussi les produits épuisés ; seul ce champ caché les distingue.
  url.searchParams.set("fmt_options[show_hidden_fields]", "true");
  url.searchParams.append("filters[product_style]", input.style);
  for (const size of ADULT_SIZES) url.searchParams.append("filters[size_product]", size);
  for (const department of DEPARTMENTS) url.searchParams.append("filters[department]", department);
  if (input.era) url.searchParams.append("filters[era]", input.era);
  return url.toString();
}

const CONDITION_BY_PRODCAT: Record<string, Condition> = {
  "Brand New": "MINT",
  Mint: "MINT",
  Excellent: "EXCELLENT",
  "Very Good": "GOOD",
  Good: "GOOD",
  Fair: "FAIR",
};

export function mapCfsCondition(prodcat: string | null | undefined): Condition | null {
  return (prodcat && CONDITION_BY_PRODCAT[prodcat]) || null;
}

const toSizes = (value: (string | number)[] | string | number | null | undefined): string[] =>
  (Array.isArray(value) ? value : value == null ? [] : [value]).map((s) => String(s).toUpperCase());

const isInStock = (value: string | boolean | null | undefined) =>
  ["1", "true"].includes(String(value).toLowerCase());

export function normalizeCfsItem(raw: CfsRawItem): CfsItem {
  const price = raw.data.price_eur ?? null;
  const special = raw.data.special_price_eur ?? null;
  const priceGbp = raw.data.price_gbp ?? null;
  const specialGbp = raw.data.special_price_gbp ?? null;
  // Le produit ne reflète qu'une de ses variantes (une par taille) : le stock se
  // lit variante par variante.
  const variants = [raw.data, ...(raw.variations ?? []).map((v) => v.data)];
  const sizes = new Set(variants.flatMap((v) => toSizes(v.size_product)));
  const inStock = new Set(variants.filter((v) => isInStock(v.in_stock)).flatMap((v) => toSizes(v.size_product)));
  return {
    cfsId: raw.data.id || raw.data.url,
    name: raw.data.name,
    url: raw.data.url,
    imageUrl: raw.data.image_url || null,
    price,
    promoPrice: price !== null && special !== null && special < price ? special : null,
    priceGbp,
    promoPriceGbp: priceGbp !== null && specialGbp !== null && specialGbp < priceGbp ? specialGbp : null,
    condition: mapCfsCondition(raw.data.prodcat),
    longSleeve: raw.data.sleeve_length === "Long-Sleeve",
    sizes: ADULT_SIZES.filter((s) => sizes.has(s)),
    inStockSizes: ADULT_SIZES.filter((s) => inStock.has(s)),
  };
}

// L'API renvoie le site international (.com) ; l'ancien index renvoyait le .co.uk.
const CFS_DOMAINS = ["classicfootballshirts.com", "classicfootballshirts.co.uk"];

export function isAllowedCfsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      CFS_DOMAINS.some((d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`))
    );
  } catch {
    return false;
  }
}

type FetchImpl = (url: string) => Promise<Response>;

/** Toutes les pages d'une tranche ; `saturated` si le plafond de l'API est atteint. */
async function fetchSlice(
  input: { team: string; style: string; era?: string },
  fetchImpl: FetchImpl
): Promise<{ items: CfsRawItem[]; saturated: boolean }> {
  const items: CfsRawItem[] = [];
  for (let page = 1; page <= PAGE_CAP / PAGE_SIZE; page++) {
    const res = await fetchImpl(buildBrowseUrl({ ...input, page }));
    if (!res.ok) throw new Error(`CFS browse ${input.team} ${input.style} : HTTP ${res.status}`);
    const body = (await res.json()) as { response?: { results?: CfsRawItem[] } };
    const results = body.response?.results ?? [];
    items.push(...results);
    if (results.length < PAGE_SIZE) return { items, saturated: false };
  }
  return { items, saturated: true };
}

/**
 * Maillots adultes d'une équipe, une tranche par type de maillot ; une tranche
 * qui atteint le plafond de 10 000 est complétée époque par époque.
 * Dédoublonnés par lien produit.
 */
export async function fetchTeamProducts(team: string, fetchImpl: FetchImpl = fetch): Promise<CfsItem[]> {
  const byUrl = new Map<string, CfsItem>();
  const add = (raw: CfsRawItem) => {
    if (!byUrl.has(raw.data.url)) byUrl.set(raw.data.url, normalizeCfsItem(raw));
  };

  for (const style of JERSEY_STYLES) {
    const slice = await fetchSlice({ team, style }, fetchImpl);
    slice.items.forEach(add);
    if (!slice.saturated) continue;
    for (const era of ERAS) {
      (await fetchSlice({ team, style, era }, fetchImpl)).items.forEach(add);
    }
  }
  return [...byUrl.values()];
}

/**
 * Équipes CFS et leur nombre de produits. `facet_options` renvoie la liste
 * complète (526 équipes) ; la facette d'une recherche s'arrête à 500.
 */
export async function fetchCfsTeams(fetchImpl: FetchImpl = fetch): Promise<{ name: string; count: number }[]> {
  const url = new URL(`${CFS_BROWSE_BASE}/facet_options`);
  url.searchParams.set("key", CFS_API_KEY);
  url.searchParams.set("facet_name", "team");
  const res = await fetchImpl(url.toString());
  if (!res.ok) throw new Error(`CFS facettes : HTTP ${res.status}`);
  const body = (await res.json()) as {
    response?: { facets?: { name: string; options?: { value: string; count: number }[] }[] };
  };
  const team = body.response?.facets?.find((f) => f.name === "team");
  return (team?.options ?? []).map((o) => ({ name: o.value, count: o.count }));
}
