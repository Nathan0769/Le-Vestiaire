import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { isSlug } from "@/lib/slug-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const searchBySlug = isSlug(id);

    const jersey = await prisma.jersey.findUnique({
      where: searchBySlug ? { slug: id } : { id },
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
