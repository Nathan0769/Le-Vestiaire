import Stripe from "stripe";

let client: Stripe | null = null;

/**
 * Client Stripe paresseux : instancié à la première requête, pas au chargement
 * du module. Évite de faire échouer le build quand `STRIPE_SECRET_KEY` n'est pas
 * défini au moment de la compilation.
 */
export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return client;
}
