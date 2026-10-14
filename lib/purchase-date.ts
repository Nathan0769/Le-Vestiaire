export type PurchaseDateErrorCode =
  | "PURCHASE_DATE_INVALID"
  | "PURCHASE_DATE_IN_FUTURE";

// Les clients envoient souvent une date seule ("2026-10-15" = minuit UTC) : un
// utilisateur en UTC+14 peut déjà être au lendemain. On tolère cette avance
// plutôt que de refuser la date du jour à une partie du monde.
const MAX_TIMEZONE_AHEAD_MS = 14 * 60 * 60 * 1000;

/**
 * Code stable de l'erreur de date d'achat (traduit par l'app mobile), ou null
 * si la date est absente (facultative) ou valide. Une date d'achat dans le
 * futur n'a pas de sens et fausse les stats (acquisition la plus récente).
 */
export function purchaseDateErrorCode(
  value: unknown,
  now: Date = new Date()
): PurchaseDateErrorCode | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return "PURCHASE_DATE_INVALID";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "PURCHASE_DATE_INVALID";

  if (date.getTime() > now.getTime() + MAX_TIMEZONE_AHEAD_MS) {
    return "PURCHASE_DATE_IN_FUTURE";
  }
  return null;
}

export const PURCHASE_DATE_ERROR_MESSAGES: Record<PurchaseDateErrorCode, string> = {
  PURCHASE_DATE_INVALID: "Date d'achat invalide",
  PURCHASE_DATE_IN_FUTURE: "La date d'achat ne peut pas être dans le futur",
};
