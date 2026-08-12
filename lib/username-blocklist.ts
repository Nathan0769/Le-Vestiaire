/**
 * Filtre de contenu pour les pseudos.
 *
 * Best-effort : impossible d'attraper tous les contournements créatifs.
 * L'objectif est de bloquer les termes évidents (insultes, scatologique,
 * extrémisme/haine) tout en limitant les faux positifs (problème Scunthorpe).
 *
 * Deux tiers de matching :
 * - SUBSTRING_BLOCKED : termes assez spécifiques pour être bloqués n'importe
 *   où dans le pseudo normalisé.
 * - EXACT_TOKEN_BLOCKED : racines courtes/ambigües bloquées uniquement si un
 *   segment (séparé par _ ou -) leur est exactement égal, pour ne pas casser
 *   des pseudos légitimes (bacon, culture, dispute...).
 *
 * Les pseudos n'autorisant que [a-zA-Z0-9_-], on normalise le leetspeak
 * (4->a, 3->e, 1->i, 0->o, 5->s, 7->t, 8->b) avant de matcher.
 */

// Termes bloqués en sous-chaîne (sur le pseudo normalisé, séparateurs retirés)
const SUBSTRING_BLOCKED = [
  // Insultes / vulgaire FR
  "connard",
  "connasse",
  "conard",
  "conasse",
  "encule",
  "enculer",
  "salope",
  "salaud",
  "salopard",
  "putain",
  "pouffiasse",
  "merde",
  "ntm",
  "fdp",
  "tapette",
  "tarlouze",
  "tantouze",
  "pede",
  "gouine",
  "couille",
  "chatte",
  "batard",
  "pisse",
  // Scatologique
  "caca",
  "pipi",
  "prout",
  "crotte",
  "zizi",
  "zboub",
  "cunnilingus",
  "penis",
  // Insultes / vulgaire EN
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "asshole",
  "dickhead",
  "pussy",
  "bastard",
  "slut",
  "whore",
  "faggot",
  "rapist",
  // Slurs racistes / homophobes
  "nigger",
  "nigga",
  "negro",
  "negre",
  "bougnoul",
  "youpin",
  "pedophile",
  // Extrémisme / haine / terrorisme
  "hitler",
  "nazi",
  "fuhrer",
  "fuehrer",
  "swastika",
  "heilhitler",
  "daesh",
  "jihad",
  "taliban",
  "alqaida",
  "alqaeda",
  "terroriste",
  "terrorist",
  "attentat",
  "kkk",
  "kluxklan",
  "genocide",
  "holocauste",
  "holocaust",
];

// Racines courtes/ambigües : bloquées seulement si un segment leur est égal
const EXACT_TOKEN_BLOCKED = ["con", "cul", "pute", "pd", "bite", "tg", "isis"];

/**
 * Normalise pour la détection : minuscules + dé-leet.
 * Ne retire PAS les séparateurs (utilisés pour la tokenisation).
 */
export function normalizeForProfanity(input: string): string {
  return input
    .toLowerCase()
    .replace(/4/g, "a")
    .replace(/3/g, "e")
    .replace(/1/g, "i")
    .replace(/0/g, "o")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/8/g, "b");
}

/**
 * Retourne true si le pseudo contient un terme interdit.
 */
export function containsProfanity(username: string): boolean {
  const normalized = normalizeForProfanity(username.trim());

  // Tier 1 : sous-chaîne sur le pseudo compacté (séparateurs retirés)
  const collapsed = normalized.replace(/[_-]/g, "");
  if (SUBSTRING_BLOCKED.some((term) => collapsed.includes(term))) {
    return true;
  }

  // Tier 2 : mot entier par segment (séparé par _ ou -)
  const tokens = normalized.split(/[_-]/);
  if (tokens.some((token) => EXACT_TOKEN_BLOCKED.includes(token))) {
    return true;
  }

  return false;
}
