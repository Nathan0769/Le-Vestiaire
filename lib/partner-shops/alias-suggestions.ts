import { normalizeClubName } from "./club-name";

/**
 * Suggestions d'alias pour les clubs qu'une boutique nomme autrement que le
 * catalogue ("Glasgow Rangers" / "Rangers FC"). Aide à la saisie uniquement :
 * chaque suggestion est relue avant d'être enregistrée.
 */

export interface ClubCandidate {
  id: string;
  name: string;
  shortName: string;
}

export interface ClubSuggestion {
  clubId: string;
  clubName: string;
  /** strong : les deux noms ont exactement les mêmes mots (hors FC, Calcio...). */
  strength: "strong" | "weak";
  score: number;
}

// Mots de forme juridique ou de liaison, qui ne distinguent pas un club.
const STOPWORDS = new Set([
  "fc", "ac", "as", "sc", "cf", "cd", "afc", "fk", "sk", "us", "ud", "rc", "ca", "sv",
  "kv", "ksv", "club", "de", "la", "le", "les", "du", "des", "the", "of", "calcio",
]);

function tokens(name: string): string[] {
  return normalizeClubName(name)
    .split(" ")
    .filter((t) => t && !STOPWORDS.has(t));
}

function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

// Graphies d'une langue à l'autre (Sevilla / Séville, Bruges / Brugge) : même
// début de mot et peu de lettres d'écart. "Carouge" / "Rouge" et "Brescia" / "Brésil" ne passent pas.
function similarWord(a: string, b: string): boolean {
  if (Math.min(a.length, b.length) < 5 || a.slice(0, 4) !== b.slice(0, 4)) return false;
  const distance = levenshtein(a, b);
  return distance <= 1 || (distance === 2 && (Math.min(a.length, b.length) >= 8 || a.length === b.length));
}

function compare(shopTokens: string[], clubTokens: string[]) {
  if (shopTokens.length === 0 || clubTokens.length === 0) return null;
  const [small, large] =
    shopTokens.length <= clubTokens.length ? [shopTokens, clubTokens] : [clubTokens, shopTokens];
  const matched = small.filter((t) => large.some((u) => u === t || similarWord(t, u))).length;
  if (matched === 0) return null;
  // Assez de mots en commun des deux côtés, sinon un seul mot courant ("Etoile") suffirait.
  if (matched / shopTokens.length < 0.5 || matched / clubTokens.length < 0.5) return null;

  // Un mot de plus d'un côté peut changer de club (Betis Séville / Séville FC) : seule
  // l'égalité exacte est sûre.
  const sameWords =
    shopTokens.length === clubTokens.length && shopTokens.every((t) => clubTokens.includes(t));
  return { strength: sameWords ? ("strong" as const) : ("weak" as const), score: matched / large.length };
}

export function suggestClub(shopName: string, clubs: ClubCandidate[]): ClubSuggestion | null {
  const shopTokens = tokens(shopName);
  let best: ClubSuggestion | null = null;

  for (const club of clubs) {
    for (const label of [club.name, club.shortName]) {
      const compared = compare(shopTokens, tokens(label));
      if (!compared) continue;
      // Un nom court ("Inter", "Deportivo") est contenu dans trop de noms pour être sûr.
      const result =
        label === club.name ? compared : { ...compared, strength: "weak" as const };
      const better =
        !best ||
        (result.strength === "strong" && best.strength === "weak") ||
        (result.strength === best.strength && result.score > best.score);
      if (better) best = { clubId: club.id, clubName: club.name, ...result };
    }
  }
  return best;
}
