import { NextResponse } from "next/server";
import { revalidateJerseysByIds } from "@/lib/catalog-revalidation";
import { syncAllPartnerShops } from "@/lib/partner-shops/sync";

export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const results = await syncAllPartnerShops();
    const changed = results.flatMap((r) => ("changedJerseyIds" in r ? r.changedJerseyIds : []));
    const revalidated = await revalidateJerseysByIds([...new Set(changed)]);
    return NextResponse.json({ results, revalidated });
  } catch (err) {
    console.error("GET /api/cron/partner-shops error:", err);
    return NextResponse.json({ error: "Erreur lors de la synchro" }, { status: 500 });
  }
}
