import { NextResponse } from "next/server";
import { snapshotMonthlyBadges } from "@/lib/achievements/monthly-badges";

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const created = await snapshotMonthlyBadges();
  return NextResponse.json({ created });
}
