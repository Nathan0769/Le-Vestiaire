import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { checkRateLimit, generousRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { getRequestLocale } from "@/lib/request-locale";
import { getCurrentAnnouncement } from "@/lib/announcements/current";

/**
 * Annonce de nouveautés à montrer à l'ouverture (web et iOS), ou null.
 * L'app iOS envoie `X-App-Version` : sa présence désigne l'app.
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const identifier = await getRateLimitIdentifier(user.id);
    if (!(await checkRateLimit(generousRateLimit, identifier)).success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const appVersion = request.headers.get("x-app-version");
    const announcement = await getCurrentAnnouncement(
      user,
      appVersion !== null ? { kind: "ios", version: appVersion || null } : { kind: "web" },
      getRequestLocale(request)
    );
    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("Erreur GET /api/announcements/current:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
