import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        leaderboardAnonymous: true,
      },
    });

    return NextResponse.json({
      leaderboardAnonymous: userData?.leaderboardAnonymous ?? true,
    });
  } catch (error) {
    console.error("Erreur récupération leaderboard settings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { leaderboardAnonymous } = await request.json();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        leaderboardAnonymous: !!leaderboardAnonymous,
      },
    });

    return NextResponse.json({
      success: true,
      leaderboardAnonymous: !!leaderboardAnonymous,
    });
  } catch (error) {
    console.error("Erreur leaderboard settings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
