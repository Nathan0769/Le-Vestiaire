import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";

// PATCH /api/user/bio
export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { bio } = await request.json();

  if (typeof bio !== "string") {
    return new NextResponse("Invalid bio", { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { bio },
    });

    return new NextResponse("Bio updated", { status: 200 });
  } catch (error) {
    console.error("Error updating bio:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// GET user bio
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { bio: true },
    });

    return NextResponse.json({ bio: dbUser?.bio ?? "" });
  } catch (error) {
    console.error("Error fetching bio:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
