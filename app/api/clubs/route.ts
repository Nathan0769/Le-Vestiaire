import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const clubs = await prisma.club.findMany({
      select: { id: true, name: true, shortName: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(clubs);
  } catch (error) {
    console.error("Erreur chargement clubs :", error);
    return new NextResponse("Erreur serveur", { status: 500 });
  }
}
