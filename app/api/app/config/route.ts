import { NextResponse } from "next/server";
import {
  COLLECTION_ITEM_LIMITS,
  JERSEY_CONDITIONS,
  JERSEY_SIZES,
  JERSEY_VERSIONS,
  PURCHASE_CURRENCIES,
} from "@/lib/collection-item-rules";
import { MAX_USER_JERSEY_PHOTOS, MAX_USER_JERSEY_PHOTOS_SUPPORTER } from "@/lib/user-jersey-photos";

/**
 * Règles lues par l'app iOS au démarrage : listes de référence et limites d'un
 * maillot de collection. L'app garde une copie embarquée de repli ; le serveur
 * reste seul juge (mêmes constantes que les routes d'ajout et d'édition).
 */
export async function GET() {
  // Pas de rate limit : constantes sans accès base, mises en cache par le CDN.
  return NextResponse.json(
    {
      collectionItem: {
        versions: JERSEY_VERSIONS,
        sizes: JERSEY_SIZES,
        conditions: JERSEY_CONDITIONS,
        currencies: PURCHASE_CURRENCIES,
        limits: COLLECTION_ITEM_LIMITS,
        maxPhotos: { free: MAX_USER_JERSEY_PHOTOS, supporter: MAX_USER_JERSEY_PHOTOS_SUPPORTER },
      },
    },
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
