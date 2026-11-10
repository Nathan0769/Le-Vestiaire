import { NextResponse } from "next/server";
import { runWishlistPromoAlerts } from "@/lib/wishlist-promo-alerts-run";

export const maxDuration = 300;

/** Résumé quotidien des promos wishlist, après les crons partner-shops et cfs-availability. */
export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const result = await runWishlistPromoAlerts();
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/cron/wishlist-promos error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
