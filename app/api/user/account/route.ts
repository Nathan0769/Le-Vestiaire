import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  strictRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import {
  deleteFromR2,
  AVATARS_BUCKET,
  USER_JERSEY_PHOTOS_BUCKET,
} from "@/lib/r2-storage";

export async function DELETE() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const identifier = await getRateLimitIdentifier(currentUser.id);
    const rateLimitResult = await checkRateLimit(strictRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        avatar: true,
        collection: { select: { userPhotoUrl: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Supprimer l'avatar R2
    if (user.avatar && AVATARS_BUCKET) {
      try {
        const key = user.avatar.split("/").pop();
        if (key) await deleteFromR2(AVATARS_BUCKET, key);
      } catch {}
    }

    // Supprimer les photos de maillots R2
    if (USER_JERSEY_PHOTOS_BUCKET) {
      for (const jersey of user.collection) {
        if (jersey.userPhotoUrl) {
          try {
            const key = jersey.userPhotoUrl.split("/").pop();
            if (key) await deleteFromR2(USER_JERSEY_PHOTOS_BUCKET, key);
          } catch {}
        }
      }
    }

    // Supprimer l'utilisateur - les cascade Prisma gèrent le reste
    // (UserJersey, Wishlist, Rating, Follow, Block, Post, Session, Account, etc.)
    await prisma.user.delete({ where: { id: user.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
