import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

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
        ...(user && {
          wishlist: {
            where: {
              userId: user.id,
            },
            select: {
              id: true,
            },
          },
        }),
      },
    });

    if (!jersey) {
      return new NextResponse("Jersey not found", { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { wishlist, ...jerseyWithoutWishlist } = jersey as any;

    const response = {
      ...jerseyWithoutWishlist,
      isInWishlist: user ? wishlist?.length > 0 : false,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET Jersey error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
