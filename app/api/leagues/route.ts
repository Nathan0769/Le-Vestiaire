import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const leagues = await prisma.league.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(leagues);
  } catch (error) {
    console.error("[LEAGUES_GET]", error);
    return new NextResponse("Erreur serveur", { status: 500 });
  }
}
