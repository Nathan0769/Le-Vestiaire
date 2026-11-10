import type { JerseyVersion, Size } from "@prisma/client";
import { SIZE_ERROR_MESSAGES, jerseySizeErrorCode } from "@/lib/jersey-size";
import { COLLECTION_ITEM_LIMITS, JERSEY_VERSIONS } from "@/lib/collection-item-rules";

/**
 * Infos cadeau d'une envie (taille, version, flocage, coup de cœur).
 * Mêmes valeurs et limites qu'un maillot de collection : la taille et le
 * flocage voulus doivent pouvoir passer tels quels dans la collection au
 * « Je l'ai reçu ». Tous les champs sont facultatifs, null efface.
 */
export type WishlistGiftPatch = {
  size?: Size | null;
  version?: JerseyVersion | null;
  flockName?: string | null;
  flockNumber?: number | null;
  priority?: 1 | 2;
};

export type WishlistGiftPatchResult =
  | { ok: true; data: WishlistGiftPatch }
  | { ok: false; error: string; code?: string };

const L = COLLECTION_ITEM_LIMITS;

export function parseWishlistGiftPatch(body: unknown): WishlistGiftPatchResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Données invalides" };
  }
  const input = body as Record<string, unknown>;
  const data: WishlistGiftPatch = {};

  if ("size" in input) {
    if (input.size === null || input.size === "") {
      data.size = null;
    } else {
      // Taille facultative ici : seul SIZE_INVALID peut sortir.
      const code = jerseySizeErrorCode(input.size);
      if (code) return { ok: false, error: SIZE_ERROR_MESSAGES[code], code };
      data.size = input.size as Size;
    }
  }

  if ("version" in input) {
    if (input.version === null || input.version === "") {
      data.version = null;
    } else if ((JERSEY_VERSIONS as readonly unknown[]).includes(input.version)) {
      data.version = input.version as JerseyVersion;
    } else {
      return { ok: false, error: "Version de maillot invalide", code: "VERSION_INVALID" };
    }
  }

  if ("flockName" in input) {
    if (input.flockName === null) {
      data.flockName = null;
    } else if (typeof input.flockName !== "string") {
      return { ok: false, error: "Données invalides" };
    } else {
      const name = input.flockName.trim();
      if (name.length > L.playerNameMax) {
        return {
          ok: false,
          error: `Le nom du joueur ne peut pas dépasser ${L.playerNameMax} caractères`,
          code: "PLAYER_NAME_TOO_LONG",
        };
      }
      data.flockName = name === "" ? null : name;
    }
  }

  if ("flockNumber" in input) {
    if (input.flockNumber === null) {
      data.flockNumber = null;
    } else {
      const num = input.flockNumber;
      if (typeof num !== "number" || !Number.isInteger(num) || num < L.playerNumberMin || num > L.playerNumberMax) {
        return {
          ok: false,
          error: `Le numéro de maillot doit être compris entre ${L.playerNumberMin} et ${L.playerNumberMax}`,
          code: "PLAYER_NUMBER_INVALID",
        };
      }
      data.flockNumber = num;
    }
  }

  if ("priority" in input) {
    if (input.priority !== 1 && input.priority !== 2) {
      return { ok: false, error: "Données invalides" };
    }
    data.priority = input.priority;
  }

  return { ok: true, data };
}

/** Taille la plus portée dans la collection, pour préremplir une envie. */
export function mostFrequentSize(sizes: ReadonlyArray<string | null | undefined>): string | null {
  const counts = new Map<string, number>();
  for (const size of sizes) {
    if (size) counts.set(size, (counts.get(size) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [size, count] of counts) {
    if (count > bestCount) {
      best = size;
      bestCount = count;
    }
  }
  return best;
}
