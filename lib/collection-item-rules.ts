import { VALID_SIZES, jerseySizeErrorCode, SIZE_ERROR_MESSAGES } from "@/lib/jersey-size";
import { purchaseDateErrorCode, PURCHASE_DATE_ERROR_MESSAGES } from "@/lib/purchase-date";
import { isSupportedCurrency, CURRENCY_ERROR_MESSAGES, SUPPORTED_CURRENCIES } from "@/lib/currency";

/**
 * Règles d'un maillot de collection, partagées par l'ajout
 * (POST /api/jerseys/[id]/collection) et l'édition (PATCH /api/user-jerseys/[id]).
 * Le serveur décide ; l'app iOS lit ces valeurs via GET /api/app/config pour
 * ne pas être plus stricte (ou plus laxiste) que lui.
 */

/** Miroir de l'enum Prisma `JerseyVersion`. */
export const JERSEY_VERSIONS = ["REPLICA", "AUTHENTIC", "STOCK_PRO", "PLAYER_ISSUE", "MATCH_WORN"] as const;

/** Miroir de l'enum Prisma `Condition`. */
export const JERSEY_CONDITIONS = ["MINT", "EXCELLENT", "GOOD", "FAIR", "POOR"] as const;

export { VALID_SIZES as JERSEY_SIZES };

export { SUPPORTED_CURRENCIES as PURCHASE_CURRENCIES };

export const COLLECTION_ITEM_LIMITS = {
  playerNameMax: 100,
  playerNumberMin: 1,
  playerNumberMax: 999,
  notesMax: 1000,
  signedByMax: 500,
  matchDescriptionMax: 500,
  certificateUrlMax: 2048,
  patchLabelMax: 50,
} as const;

export type CollectionItemFieldError = { error: string; code: string };

export type CollectionItemFields = {
  version?: unknown;
  size?: unknown;
  condition?: unknown;
  playerName?: unknown;
  playerNumber?: unknown;
  purchasePrice?: unknown;
  purchaseCurrency?: unknown;
  purchaseDate?: unknown;
  notes?: unknown;
  signedBy?: unknown;
  matchDescription?: unknown;
  certificateUrl?: unknown;
};

const L = COLLECTION_ITEM_LIMITS;

function tooLong(value: unknown, max: number): boolean {
  return typeof value === "string" && value.length > max;
}

/** Première erreur de champ (message FR + code traduit par l'app), ou null. */
export function collectionItemFieldError(f: CollectionItemFields): CollectionItemFieldError | null {
  if (f.version && !(JERSEY_VERSIONS as readonly unknown[]).includes(f.version)) {
    return { error: "Version de maillot invalide", code: "VERSION_INVALID" };
  }

  const sizeCode = jerseySizeErrorCode(f.size);
  if (sizeCode) return { error: SIZE_ERROR_MESSAGES[sizeCode], code: sizeCode };

  const dateCode = purchaseDateErrorCode(f.purchaseDate);
  if (dateCode) return { error: PURCHASE_DATE_ERROR_MESSAGES[dateCode], code: dateCode };

  if (!f.condition) return { error: "L'état est obligatoire", code: "CONDITION_REQUIRED" };

  if (tooLong(f.playerName, L.playerNameMax)) {
    return { error: `Le nom du joueur ne peut pas dépasser ${L.playerNameMax} caractères`, code: "PLAYER_NAME_TOO_LONG" };
  }

  if (f.playerNumber !== null && f.playerNumber !== undefined) {
    const num = parseInt(String(f.playerNumber), 10);
    if (isNaN(num) || num < L.playerNumberMin || num > L.playerNumberMax) {
      return {
        error: `Le numéro de maillot doit être compris entre ${L.playerNumberMin} et ${L.playerNumberMax}`,
        code: "PLAYER_NUMBER_INVALID",
      };
    }
  }

  if (tooLong(f.notes, L.notesMax)) {
    return { error: `Les notes ne peuvent pas dépasser ${L.notesMax} caractères`, code: "NOTES_TOO_LONG" };
  }
  if (tooLong(f.signedBy, L.signedByMax)) {
    return { error: `Le champ 'signé par' ne peut pas dépasser ${L.signedByMax} caractères`, code: "SIGNED_BY_TOO_LONG" };
  }
  if (tooLong(f.matchDescription, L.matchDescriptionMax)) {
    return {
      error: `La description du match ne peut pas dépasser ${L.matchDescriptionMax} caractères`,
      code: "MATCH_DESCRIPTION_TOO_LONG",
    };
  }

  if (f.certificateUrl) {
    const url = String(f.certificateUrl);
    if (url.length > L.certificateUrlMax) {
      return { error: "L'URL du certificat est trop longue", code: "CERTIFICATE_URL_TOO_LONG" };
    }
    try {
      if (new URL(url).protocol !== "https:") {
        return { error: "L'URL du certificat doit commencer par https://", code: "CERTIFICATE_URL_NOT_HTTPS" };
      }
    } catch {
      return { error: "L'URL du certificat est invalide", code: "CERTIFICATE_URL_INVALID" };
    }
  }

  if (f.purchasePrice !== null && f.purchasePrice !== undefined) {
    const price = parseFloat(String(f.purchasePrice));
    if (isNaN(price) || price < 0) {
      return { error: "Le prix d'achat doit être un nombre positif valide", code: "PURCHASE_PRICE_INVALID" };
    }
  }

  if (f.purchaseCurrency !== null && f.purchaseCurrency !== undefined && !isSupportedCurrency(f.purchaseCurrency)) {
    return { error: CURRENCY_ERROR_MESSAGES.PURCHASE_CURRENCY_INVALID, code: "PURCHASE_CURRENCY_INVALID" };
  }

  return null;
}

export type PatchInput = { patchId?: string; customLabel?: string };

/**
 * Patchs envoyés par le client : patchs catalogue dédoublonnés, labels
 * personnalisés nettoyés. L'existence des patchs et leur exclusivité sont
 * vérifiées ensuite en base par la route.
 */
export function normalizePatchInputs(
  patches: unknown
): { ok: true; patches: PatchInput[] } | { ok: false; error: string; code?: string } {
  if (!Array.isArray(patches)) return { ok: false, error: "patches doit être un tableau" };

  const normalized: PatchInput[] = [];
  const seen = new Set<string>();
  for (const raw of patches as PatchInput[]) {
    const patchId = typeof raw?.patchId === "string" ? raw.patchId : undefined;
    const customLabel = typeof raw?.customLabel === "string" ? raw.customLabel.trim() : undefined;
    if (!patchId && !customLabel) {
      return { ok: false, error: "Chaque patch doit avoir un patchId ou un customLabel" };
    }
    if (customLabel && customLabel.length > L.patchLabelMax) {
      return {
        ok: false,
        error: `Le label personnalisé ne peut pas dépasser ${L.patchLabelMax} caractères`,
        code: "PATCH_LABEL_TOO_LONG",
      };
    }
    if (patchId) {
      if (seen.has(patchId)) continue;
      seen.add(patchId);
    }
    normalized.push({ patchId, customLabel: customLabel || undefined });
  }
  return { ok: true, patches: normalized };
}
