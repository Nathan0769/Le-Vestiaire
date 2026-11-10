import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { checkRateLimit, generousRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { getPublicShare } from "@/lib/wishlist-shares";

/** Page partagée en JSON (public). Réservations masquées si le propriétaire regarde. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await getCurrentUser();
    const identifier = await getRateLimitIdentifier(viewer?.id);
    if (!(await checkRateLimit(generousRateLimit, identifier)).success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const { id } = await params;
    const share = await getPublicShare(id, viewer?.id ?? null);
    if (!share) {
      return NextResponse.json({ error: "Lien de partage introuvable", code: "SHARE_NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(share, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erreur GET /api/wishlist/shares/[id]/public:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
