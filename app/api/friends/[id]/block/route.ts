import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id: targetUserId } = await params;

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous bloquer vous-même" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: user.id },
        ],
      },
    });

    if (existing) {
      const updated = await prisma.friendship.update({
        where: { id: existing.id },
        data: {
          status: "BLOCKED",
          senderId: user.id,
          receiverId: targetUserId,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Utilisateur bloqué",
        friendship: {
          id: updated.id,
          status: updated.status,
        },
      });
    } else {
      const friendship = await prisma.friendship.create({
        data: {
          senderId: user.id,
          receiverId: targetUserId,
          status: "BLOCKED",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Utilisateur bloqué",
        friendship: {
          id: friendship.id,
          status: friendship.status,
        },
      });
    }
  } catch (error) {
    console.error("Erreur block:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
