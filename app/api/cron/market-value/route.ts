import { NextResponse } from "next/server";
import { recomputeAllMarketValues } from "@/lib/market-value/compute";

export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const result = await recomputeAllMarketValues();
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/cron/market-value error:", err);
    return NextResponse.json(
      { error: "Erreur lors du recalcul des cotes" },
      { status: 500 }
    );
  }
}
