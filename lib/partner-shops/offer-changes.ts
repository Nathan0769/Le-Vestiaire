export interface OfferState {
  available: boolean;
  price: number;
  compareAtPrice: number | null;
  jerseyId: string | null;
}

/** Ce qu'affiche la fiche maillot : un produit indisponible ou non relié n'affiche rien. */
function displayed(offer: OfferState | null) {
  if (!offer || !offer.available || !offer.jerseyId) return null;
  return { price: offer.price, compareAtPrice: offer.compareAtPrice, jerseyId: offer.jerseyId };
}

/**
 * Vrai si la fiche maillot doit être régénérée (ISR) : seules les variations
 * visibles comptent, pour ne pas réveiller la base à chaque synchro.
 */
export function offerChanged(before: OfferState | null, after: OfferState | null): boolean {
  const a = displayed(before);
  const b = displayed(after);
  if (!a || !b) return a !== b;
  return a.price !== b.price || a.compareAtPrice !== b.compareAtPrice || a.jerseyId !== b.jerseyId;
}
