/**
 * Prix en euros tel que le site CFS l'affiche. Le `price_eur` de l'API ne
 * correspond pas au site (de 1,08 à 1,32 × la livre selon le produit) : CFS
 * convertit son prix en livres, seul prix fiable, avec une marge de change puis
 * arrondit à X,99. Marge mesurée le 2026-11-05 sur 3 produits (£29,99 -> 36,99 €,
 * £89,99 -> 109,99 €, £124,99 -> 151,99 €, taux BCE 1,1982).
 */
export const CFS_FX_MARKUP = 1.016;

export function cfsSitePriceEur(gbp: number, gbpToEur: number): number {
  // Arrondi au centime : comparé au prix relu en base (Decimal) pour détecter un changement.
  return Math.round((Math.round(gbp * gbpToEur * CFS_FX_MARKUP) - 0.01) * 100) / 100;
}

interface CfsPrices {
  price: number;
  promoPrice: number | null;
  priceGbp: number | null;
  promoPriceGbp: number | null;
}

/** Prix et promo affichés ; sans prix en livres, le prix en euros de l'API. */
export function cfsSitePrices(p: CfsPrices, gbpToEur: number): { price: number; promoPrice: number | null } {
  if (p.priceGbp === null) return { price: p.price, promoPrice: p.promoPrice };
  return {
    price: cfsSitePriceEur(p.priceGbp, gbpToEur),
    promoPrice: p.promoPriceGbp === null ? null : cfsSitePriceEur(p.promoPriceGbp, gbpToEur),
  };
}
