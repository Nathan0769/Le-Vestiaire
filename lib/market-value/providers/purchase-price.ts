import prisma from "@/lib/prisma";
import { JerseyVersion } from "@prisma/client";
import type { Condition, PriceSignal } from "../types";

/**
 * Signaux "vente réelle" issus de nos utilisateurs : les prix d'achat déclarés.
 * Source propriétaire, mais BRUITÉE — un prix d'achat peut être très décorrélé
 * de la valeur du maillot "standard". On ne garde donc que des comparables propres :
 * on exclut cadeaux, box mystère, signés, certificats d'authenticité, maillots
 * FLOQUÉS (nom/numéro = prime variable), versions premium (match-worn / player-issue,
 * x plusieurs fois le prix) et maillots avec patches (prime variable).
 * L'état est normalisé plus tard par l'agrégateur ; la médiane absorbe le reste.
 */
export async function purchasePriceSignals(jerseyId: string): Promise<PriceSignal[]> {
  const items = await prisma.userJersey.findMany({
    where: {
      jerseyId,
      purchasePrice: { not: null },
      isGift: false,
      isFromMysteryBox: false,
      isSigned: false,
      hasAuthCertificate: false,
      playerName: null,
      playerNumber: null,
      version: { notIn: [JerseyVersion.MATCH_WORN, JerseyVersion.PLAYER_ISSUE] },
      patches: { none: {} },
    },
    select: { purchasePrice: true, condition: true, purchaseDate: true, createdAt: true },
  });

  return items.map((it) => ({
    price: Number(it.purchasePrice),
    type: "sold",
    source: "purchasePrice",
    condition: it.condition as Condition,
    date: it.purchaseDate ?? it.createdAt,
  }));
}
