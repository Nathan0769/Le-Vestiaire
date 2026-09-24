import { NextResponse } from "next/server";
import { refreshEbayMarketData } from "@/lib/market-value/ebay/refresh";

export const maxDuration = 300;

/**
 * Rafraîchit par lot les données marché eBay des maillots possédés (Browse API).
 * Ne stocke que des prix agrégés (aucune PII eBay). Ordre par ancienneté : sur
 * plusieurs exécutions, tout le parc possédé est couvert en restant sous quota.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const limit = Number(new URL(request.url).searchParams.get("limit")) || 300;

  try {
    const result = await refreshEbayMarketData(limit);
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/cron/ebay-refresh error:", err);
    return NextResponse.json(
      { error: "Erreur lors du rafraîchissement eBay" },
      { status: 500 }
    );
  }
}
