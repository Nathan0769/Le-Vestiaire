import { NextResponse } from "next/server";
import { generousRateLimit, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";
import { IOS_MINIMUM_VERSION, isUpdateRequired } from "@/lib/app-version";

/**
 * Statut de la version de l'app iOS (header `X-App-Version`). Public : l'écran
 * « Mise à jour requise » doit pouvoir s'afficher avant la connexion.
 * `updateRequired` reste false tant que `IOS_MINIMUM_VERSION` est null.
 */
export async function GET(request: Request) {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(generousRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const version = request.headers.get("x-app-version");
  return NextResponse.json(
    { updateRequired: isUpdateRequired(version, IOS_MINIMUM_VERSION) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
