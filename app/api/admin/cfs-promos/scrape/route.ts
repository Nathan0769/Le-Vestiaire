import { NextResponse } from "next/server";
import { requireRole } from "@/lib/check-permission";
import { refreshCfsPromos } from "@/lib/cfs-promos-refresh";

export const maxDuration = 300;

export async function POST() {
  const { error } = await requireRole(["superadmin"]);
  if (error) return error;

  try {
    const result = await refreshCfsPromos();
    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/admin/cfs-promos/scrape error:", err);
    return NextResponse.json({ error: "Erreur lors du scraping" }, { status: 500 });
  }
}
