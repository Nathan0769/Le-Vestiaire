import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getRateLimitIdentifier, strictRateLimit } from "@/lib/rate-limit";
import { reserveGift } from "@/lib/gift-reservations";
import { GIFT_NAME_MAX } from "@/lib/gift-reservation-token";

const ReserveSchema = z.object({
  wishlistId: z.string().min(1).max(64),
  name: z.string().max(GIFT_NAME_MAX * 2),
});

/**
 * « Je l'offre », sans compte : seule écriture publique de la fonctionnalité,
 * d'où le rate limit strict par IP. Le jeton n'est renvoyé qu'ici, une fois.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Bucket séparé de l'auth : réserver ne doit pas bloquer une connexion depuis la même IP.
    const identifier = `gift:${await getRateLimitIdentifier()}`;
    if (!(await checkRateLimit(strictRateLimit, identifier)).success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const parsed = ReserveSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { id } = await params;
    const result = await reserveGift(id, parsed.data.wishlistId, parsed.data.name);
    if (result.ok) {
      return NextResponse.json({ token: result.token }, { status: 201 });
    }
    switch (result.reason) {
      case "ALREADY_RESERVED":
        return NextResponse.json({ error: "Ce maillot est déjà réservé", code: "ALREADY_RESERVED" }, { status: 409 });
      case "SHARE_NOT_FOUND":
        return NextResponse.json({ error: "Lien de partage introuvable", code: "SHARE_NOT_FOUND" }, { status: 404 });
      case "INVALID_NAME":
        return NextResponse.json({ error: "Prénom invalide" }, { status: 400 });
    }
  } catch (error) {
    console.error("Erreur POST /api/wishlist/shares/[id]/reservations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
