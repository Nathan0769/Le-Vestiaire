import type { JerseyType } from "@/types/jersey";

/**
 * Fallback runtime pour la description d'une fiche maillot.
 *
 * N'est utilise QUE quand aucune description manuelle/communautaire n'existe.
 * Ne stocke rien : le texte est calcule au rendu SSR (fiche `force-dynamic`),
 * donc visible par Googlebot/AdSense sans jamais ecraser le champ manuel.
 *
 * Priorite au contenu FACTUEL et unique (titres gagnes cette saison-la, joueurs
 * de l'effectif). Les phrases generiques ne servent que de bouche-trou pour
 * atteindre le plancher de mots quand aucun fait n'est disponible. Aucune donnee
 * inventee : toute clause sans donnee est omise.
 */

const MIN_WORDS = 80;

export interface AutoJerseyDescriptionTrophy {
  competition: string;
  /** "Winner" | "Finalist" (valeurs de ClubTrophy.place). */
  place: string;
}

export interface AutoJerseyDescriptionInput {
  /** Sert a la rotation deterministe de la charpente. */
  id: string;
  clubName: string;
  clubShortName: string;
  /** Format "YYYY-YYYY" (ex: "2023-2024"). */
  season: string;
  type: JerseyType;
  variant: number;
  brand: string;
  /** Ligue DE la saison (peut differer de la ligue actuelle du club). */
  leagueName: string;
  /** Titres/finales du club cette saison-la (deja filtres clubId+season). */
  trophies?: AutoJerseyDescriptionTrophy[];
  /** Effectif de la saison, deja trie par pertinence (temps de jeu). */
  players?: { name: string }[];
  collectionCount?: number;
  averageRating?: number;
  totalRatings?: number;
  /** "fr" -> francais ; tout le reste -> anglais. */
  locale: string;
}

type TypeCategory = "home" | "away" | "third" | "fourth" | "gk" | "special";

const TYPE_CATEGORY: Partial<Record<JerseyType, TypeCategory>> = {
  HOME: "home",
  AWAY: "away",
  THIRD: "third",
  FOURTH: "fourth",
  GOALKEEPER: "gk",
};

function typeCategory(type: JerseyType): TypeCategory {
  return TYPE_CATEGORY[type] ?? "special";
}

const ROLE_LABEL: Record<"fr" | "en", Record<TypeCategory, string>> = {
  fr: {
    home: "domicile",
    away: "extérieur",
    third: "third",
    fourth: "quatrième",
    gk: "de gardien",
    special: "édition spéciale",
  },
  en: {
    home: "home",
    away: "away",
    third: "third",
    fourth: "fourth",
    gk: "goalkeeper",
    special: "special edition",
  },
};

/** Hash djb2 stable -> entier positif, pour une charpente deterministe. */
function stableHash(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return hash >>> 0;
}

/** Un maillot est "vintage" a partir de 10 saisons de recul. */
function isVintage(season: string): boolean {
  const startYear = Number(season.slice(0, 4));
  if (!Number.isFinite(startYear)) return false;
  return new Date().getFullYear() - startYear >= 10;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Enumeration humaine : ["a"] -> "a" ; ["a","b"] -> "a et b" ; ["a","b","c"] -> "a, b et c". */
function joinList(items: string[], conjunction: string): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} ${conjunction} ${items[items.length - 1]}`;
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}

function trophyClause(
  lang: "fr" | "en",
  trophies: AutoJerseyDescriptionTrophy[] | undefined,
  club: string
): string | null {
  if (!trophies?.length) return null;
  const winners = dedupe(
    trophies.filter((t) => t.place === "Winner").map((t) => t.competition)
  ).slice(0, 2);
  const finalists = dedupe(
    trophies.filter((t) => t.place === "Finalist").map((t) => t.competition)
  ).slice(0, 2);

  if (lang === "fr") {
    if (winners.length) {
      return `Lors de cette saison, ${club} a remporté ${joinList(winners, "et")}.`;
    }
    if (finalists.length) {
      return `Cette saison-là, ${club} a atteint la finale de ${joinList(finalists, "et")}.`;
    }
    return null;
  }
  if (winners.length) {
    return `That season, ${club} won ${joinList(winners, "and")}.`;
  }
  if (finalists.length) {
    return `That season, ${club} reached the final of ${joinList(finalists, "and")}.`;
  }
  return null;
}

function playerClause(
  lang: "fr" | "en",
  players: { name: string }[] | undefined
): string | null {
  if (!players?.length) return null;
  const names = dedupe(players.map((p) => p.name).filter(Boolean)).slice(0, 3);
  if (!names.length) return null;

  if (lang === "fr") {
    return names.length === 1
      ? `${names[0]} faisait partie de l'effectif cette saison-là.`
      : `Des joueurs comme ${joinList(names, "et")} composaient l'effectif cette saison-là.`;
  }
  return names.length === 1
    ? `${names[0]} was part of the squad that season.`
    : `Squad members such as ${joinList(names, "and")} featured that season.`;
}

function socialClause(
  lang: "fr" | "en",
  collectionCount: number,
  averageRating: number,
  totalRatings: number
): string | null {
  const hasCollections = collectionCount > 0;
  const hasRatings = totalRatings > 0;
  const rating = averageRating.toFixed(1);

  if (lang === "fr") {
    if (hasCollections && hasRatings)
      return `Il est déjà présent dans ${collectionCount} collections et affiche une note moyenne de ${rating}/5.`;
    if (hasCollections)
      return `Il est déjà présent dans ${collectionCount} collections de membres.`;
    if (hasRatings)
      return `Il affiche une note moyenne de ${rating}/5 attribuée par les membres.`;
    return null;
  }
  if (hasCollections && hasRatings)
    return `It already appears in ${collectionCount} collections and holds an average rating of ${rating}/5.`;
  if (hasCollections)
    return `It already appears in ${collectionCount} member collections.`;
  if (hasRatings)
    return `It holds an average rating of ${rating}/5 given by members.`;
  return null;
}

function build(
  lang: "fr" | "en",
  input: AutoJerseyDescriptionInput,
  variantIndex: number
): string {
  const role = ROLE_LABEL[lang][typeCategory(input.type)];
  const vintage = isVintage(input.season);
  const club = input.clubName;
  const shortClub = input.clubShortName || input.clubName;

  const opening =
    lang === "fr"
      ? variantIndex === 0
        ? `Le maillot ${role} ${input.season} de ${club} est une tenue signée ${input.brand}.`
        : `Signé ${input.brand}, le maillot ${role} de ${club} pour la saison ${input.season} rejoint le catalogue du Vestiaire.`
      : variantIndex === 0
      ? `The ${input.season} ${role} shirt of ${club} is a kit made by ${input.brand}.`
      : `Made by ${input.brand}, the ${role} shirt of ${club} for the ${input.season} season joins the Le Vestiaire catalogue.`;

  const league =
    lang === "fr"
      ? `Porté en ${input.leagueName}, il correspond à la saison ${input.season} du club.`
      : `Worn in ${input.leagueName}, it corresponds to the club's ${input.season} season.`;

  const era =
    lang === "fr"
      ? vintage
        ? `Ce modèle plus ancien figure parmi les pièces rétro recherchées par les collectionneurs.`
        : `Cette édition récente fait partie des maillots contemporains suivis par les collectionneurs.`
      : vintage
      ? `This older model is among the retro pieces sought after by collectors.`
      : `This recent edition is one of the contemporary kits followed by collectors.`;

  const platform =
    lang === "fr"
      ? `Sur Le Vestiaire, chaque collectionneur peut l'ajouter à sa collection, le noter et le comparer aux autres tenues du club.`
      : `On Le Vestiaire, every collector can add it to their collection, rate it and compare it with the club's other kits.`;

  const utility =
    lang === "fr"
      ? `Saison, équipementier et type sont réunis pour identifier précisément ce maillot dans une collection ou une wishlist.`
      : `Season, manufacturer and type are gathered to identify this shirt precisely in a collection or a wishlist.`;

  // Bouche-trou generique : n'apparait que si le contenu factuel ne suffit pas.
  const filler =
    lang === "fr"
      ? `Les designs ${input.brand} de cette période associent l'identité visuelle du club aux codes de la marque.`
      : `The ${input.brand} designs of this period pair the club's visual identity with the brand's codes.`;

  const trophy = trophyClause(lang, input.trophies, shortClub);
  const player = playerClause(lang, input.players);
  const social = socialClause(
    lang,
    input.collectionCount ?? 0,
    input.averageRating ?? 0,
    input.totalRatings ?? 0
  );

  const withoutFiller = [
    opening,
    trophy,
    player,
    league,
    era,
    platform,
    utility,
    social,
  ].filter((s): s is string => Boolean(s));

  if (countWords(withoutFiller.join(" ")) >= MIN_WORDS) {
    return withoutFiller.join(" ");
  }

  // Contenu factuel insuffisant : on injecte le bouche-trou avant les phrases
  // de plateforme pour atteindre le plancher.
  return [opening, trophy, player, league, era, filler, platform, utility, social]
    .filter((s): s is string => Boolean(s))
    .join(" ");
}

export function autoJerseyDescription(input: AutoJerseyDescriptionInput): string {
  const variantIndex = stableHash(input.id) % 2;
  const lang: "fr" | "en" = input.locale === "fr" ? "fr" : "en";
  return build(lang, input, variantIndex);
}
