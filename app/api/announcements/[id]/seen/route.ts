import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { checkRateLimit, getRateLimitIdentifier, standardRateLimit } from "@/lib/rate-limit";
import { markAnnouncementSeen } from "@/lib/announcements/current";

/** L'annonce (et les plus anciennes) ne sera plus montrée à ce compte. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    if (!(await markAnnouncementSeen(user.id, id))) {
      return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Erreur POST /api/announcements/[id]/seen:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
