import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { strictRateLimit, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";
import { syncSupporterPlan } from "@/lib/sync-supporter-plan";
import { reportError } from "@/lib/report-error";

/**
 * Recalcule le plan Supporter du compte connecté à partir de Stripe et Apple.
 * Appelé par l'app iOS après un achat ou une restauration : le compte passe
 * Supporter sans attendre le webhook, et un achat anonyme rattaché après coup
 * est rattrapé. Ne fait que relire les sources : aucun moyen de s'attribuer PRO.
 */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Chaque appel interroge Stripe et RevenueCat : palier le plus strict.
    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(strictRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const result = await syncSupporterPlan(user.id);
    if (!result) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    return NextResponse.json({
      plan: result.next,
      isSupporter: result.next === "PRO",
    });
  } catch (error) {
    await reportError("supporter.sync", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
