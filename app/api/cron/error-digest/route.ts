import { NextResponse } from "next/server";
import { runErrorDigest } from "@/lib/error-digest";

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const result = await runErrorDigest();
  return NextResponse.json(result);
}
