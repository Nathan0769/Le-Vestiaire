import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revenueCatCandidateUserIds } from "@/lib/supporter-sync";
import { syncSupporterPlan } from "@/lib/sync-supporter-plan";
import { reportError } from "@/lib/report-error";

/**
 * Webhook RevenueCat (abonnement Supporter iOS via IAP Apple).
 * L'app appelle `Purchases.logIn(User.id)` → `app_user_id = User.id`.
 *
 * Auth : header `Authorization` == `REVENUECAT_WEBHOOK_SECRET` (configuré à
 * l'identique dans le dashboard RevenueCat).
 *
 * L'événement ne sert qu'à savoir quels comptes recalculer : le plan est relu
 * chez Stripe et RevenueCat (`syncSupporterPlan`). Un événement rejoué ou reçu
 * dans le désordre ne peut donc pas inverser l'état, et une expiration Apple ne
 * rétrograde pas un abonné Stripe (spec docs/specs/2026-10-15-supporter-sync.md).
 */
export async function POST(request: Request) {
  try {
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
    const auth = request.headers.get("authorization");
    if (!secret || auth !== secret) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const event: unknown = body?.event;
    if (!event || typeof event !== "object" || typeof (event as { type?: unknown }).type !== "string") {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const type = (event as { type: string }).type;
    if (type === "TEST") {
      return NextResponse.json({ received: true });
    }

    // Un achat sous ID anonyme puis rattaché n'est retrouvable que via les
    // alias ou un TRANSFER : on cherche tous les comptes réels concernés.
    const candidates = revenueCatCandidateUserIds(event as Record<string, unknown>);
    const users = candidates.length
      ? await prisma.user.findMany({
          where: { id: { in: candidates } },
          select: { id: true },
        })
      : [];

    if (users.length === 0) {
      console.warn("[RevenueCat Webhook] aucun compte trouvé", { type, candidates });
      return NextResponse.json({ received: true });
    }

    // Une source injoignable lève une erreur → 500 → RevenueCat réessaie.
    for (const user of users) {
      await syncSupporterPlan(user.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    await reportError("revenuecat.webhook", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
