import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const collectionItems = await prisma.userJersey.findMany({
      where: { userId: currentUser.id },
      select: {
        id: true,
        jerseyId: true,
        size: true,
        condition: true,
        hasTags: true,
        playerName: true,
        playerNumber: true,
        purchasePrice: true,
        purchaseDate: true,
        notes: true,
        isGift: true,
        isFromMysteryBox: true,
        userPhotoUrl: true,
        createdAt: true,
        updatedAt: true,
        jersey: {
          include: {
            club: {
              include: {
                league: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = await Promise.all(
      collectionItems.map(async (item) => {
        let userPhotoSignedUrl = null;
        if (item.userPhotoUrl) {
          const { data } = await supabaseAdmin.storage
            .from("jersey-photos")
            .createSignedUrl(item.userPhotoUrl, 60 * 60);
          userPhotoSignedUrl = data?.signedUrl ?? null;
        }

        return {
          ...item,
          userPhotoUrl: userPhotoSignedUrl,
          purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
          jersey: {
            ...item.jersey,
            retailPrice: item.jersey.retailPrice
              ? Number(item.jersey.retailPrice)
              : null,
          },
        };
      })
    );

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Erreur GET /api/collection:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
