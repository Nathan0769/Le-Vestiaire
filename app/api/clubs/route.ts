import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const clubs = await prisma.club.findMany({
      select: {
        id: true,
        name: true,
        shortName: true,
        league: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(clubs);
  } catch (error) {
    console.error("Error loading clubs:", error);
    return new NextResponse("Server error", { status: 500 });
  }
}
