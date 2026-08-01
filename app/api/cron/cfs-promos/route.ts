import { NextResponse } from "next/server";
import { refreshCfsPromos } from "@/lib/cfs-promos-refresh";

export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const result = await refreshCfsPromos();
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/cron/cfs-promos error:", err);
    return NextResponse.json({ error: "Erreur lors du scraping" }, { status: 500 });
  }
}
