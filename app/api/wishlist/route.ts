import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { findOwnerWishlistItems } from "@/lib/wishlist-items";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const items = await findOwnerWishlistItems({ userId: currentUser.id });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Erreur GET /api/wishlist:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
