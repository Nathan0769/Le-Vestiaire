import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";

// GET /api/user/favorite-club
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        favoriteClub: true,
      },
    });

    if (!dbUser?.favoriteClub) return NextResponse.json(null);
    return NextResponse.json({
      id: dbUser.favoriteClub.id,
      name: dbUser.favoriteClub.name,
    });
  } catch (error) {
    console.error("Error fetching favorite club:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// PATCH /api/user/favorite-club
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  let favoriteClubId: unknown;
  try {
    const body = await request.json();
    favoriteClubId = body?.favoriteClubId;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  if (typeof favoriteClubId !== "string" || favoriteClubId.trim() === "") {
    return NextResponse.json({ error: "Identifiant club invalide" }, { status: 400 });
  }

  try {
    // Vérifier que le club existe avant de l'associer
    const club = await prisma.club.findUnique({
      where: { id: favoriteClubId },
      select: { id: true },
    });

    if (!club) {
      return NextResponse.json({ error: "Club introuvable" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { favoriteClubId },
    });

    return new NextResponse("Favorite club updated", { status: 200 });
  } catch (error) {
    console.error("Error updating favorite club:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
