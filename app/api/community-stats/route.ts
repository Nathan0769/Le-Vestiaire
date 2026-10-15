import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  generousRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { getGlobalStatsCached } from "@/lib/global-stats";
import type { CommunityStatsResponse } from "@/types/community-stats";

export async function GET() {
  try {
    const user = await getCurrentUser();

    const identifier = await getRateLimitIdentifier(user?.id);
    const rateLimitResult = await checkRateLimit(generousRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Trop de requêtes" },
        { status: 429 }
      );
    }

    const global = await getGlobalStatsCached();

    const response: CommunityStatsResponse = { global };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching community stats:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
