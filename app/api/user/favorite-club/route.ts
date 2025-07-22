import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";

// GET /api/user/favorite-club
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

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

  const { favoriteClubId } = await request.json();
  if (typeof favoriteClubId !== "string") {
    return new NextResponse("Invalid club ID", { status: 400 });
  }

  try {
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
