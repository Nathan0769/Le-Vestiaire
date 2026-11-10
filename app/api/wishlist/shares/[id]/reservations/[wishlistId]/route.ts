import { NextResponse } from "next/server";
import { checkRateLimit, getRateLimitIdentifier, strictRateLimit } from "@/lib/rate-limit";
import { cancelGift } from "@/lib/gift-reservations";

/** Annule une réservation avec le jeton du navigateur qui l'a créée (header X-Reservation-Token). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; wishlistId: string }> }
) {
  try {
    const identifier = `gift:${await getRateLimitIdentifier()}`;
    if (!(await checkRateLimit(strictRateLimit, identifier)).success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const { id, wishlistId } = await params;
    const cancelled = await cancelGift(id, wishlistId, request.headers.get("x-reservation-token"));
    if (!cancelled) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/wishlist/shares/[id]/reservations/[wishlistId]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
