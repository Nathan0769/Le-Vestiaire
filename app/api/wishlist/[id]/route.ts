import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { checkRateLimit, getRateLimitIdentifier, standardRateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { parseWishlistGiftPatch } from "@/lib/wishlist-gift-fields";
import { findOwnerWishlistItems } from "@/lib/wishlist-items";

/** Infos cadeau d'une envie (taille, version, flocage, coup de cœur). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const parsed = parseWishlistGiftPatch(body);
    if (!parsed.ok) {
      return NextResponse.json(
        parsed.code ? { error: parsed.error, code: parsed.code } : { error: parsed.error },
        { status: 400 }
      );
    }

    const { id } = await params;
    // Filtre sur userId : l'envie d'un autre renvoie 404, sans révéler qu'elle existe.
    const { count } = await prisma.wishlist.updateMany({
      where: { id, userId: user.id },
      data: parsed.data,
    });
    if (count === 0) {
      return NextResponse.json({ error: "Envie introuvable" }, { status: 404 });
    }

    const [item] = await findOwnerWishlistItems({ id, userId: user.id });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Erreur PATCH /api/wishlist/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
