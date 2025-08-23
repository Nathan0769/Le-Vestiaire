import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jersey = await prisma.jersey.findUnique({
      where: {
        id: params.id,
      },
      include: {
        club: {
          include: {
            league: true,
          },
        },
      },
    });

    if (!jersey) {
      return new NextResponse("Jersey not found", { status: 404 });
    }

    return NextResponse.json(jersey);
  } catch (error) {
    console.error("GET Jersey error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
