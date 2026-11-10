import { NextResponse } from "next/server";
import { revalidateJerseysByIds } from "@/lib/catalog-revalidation";
import { scrapeCfsAvailability } from "@/lib/cfs-availability-scraper";
import { reportError } from "@/lib/report-error";

export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { changedJerseyIds, ...stats } = await scrapeCfsAvailability();
    const revalidated = await revalidateJerseysByIds(changedJerseyIds);
    return NextResponse.json({ stats, changed: changedJerseyIds.length, revalidated });
  } catch (err) {
    await reportError("cron.cfs-availability", err);
    return NextResponse.json({ error: "Erreur lors du scraping" }, { status: 500 });
  }
}
