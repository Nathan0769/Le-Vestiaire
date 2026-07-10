import { NextResponse } from "next/server";
import { requireRole } from "@/lib/check-permission";
import { scrapeCfsAvailability } from "@/lib/cfs-availability-scraper";

export const maxDuration = 300;

export async function POST() {
  const { error } = await requireRole(["superadmin"]);
  if (error) return error;

  try {
    const stats = await scrapeCfsAvailability();
    return NextResponse.json({ stats });
  } catch (err) {
    console.error("POST /api/admin/cfs-availability/scrape error:", err);
    return NextResponse.json(
      { error: "Erreur lors du scraping" },
      { status: 500 }
    );
  }
}
