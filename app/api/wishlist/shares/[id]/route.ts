import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { checkRateLimit, getRateLimitIdentifier, standardRateLimit } from "@/lib/rate-limit";
import { revokeShare } from "@/lib/wishlist-shares";

/** Révoque un lien de partage du propriétaire. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const identifier = await getRateLimitIdentifier(user.id);
    if (!(await checkRateLimit(standardRateLimit, identifier)).success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const { id } = await params;
    if (!(await revokeShare(user.id, id))) {
      return NextResponse.json({ error: "Lien de partage introuvable", code: "SHARE_NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/wishlist/shares/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
