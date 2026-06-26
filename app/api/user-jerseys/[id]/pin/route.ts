import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { MAX_PINS, canPin } from "@/lib/collection-pin";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté" },
        { status: 401 }
      );
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const existing = await prisma.userJersey.findUnique({
      where: { id },
      select: { id: true, userId: true, pinnedAt: true },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Maillot introuvable dans votre collection" },
        { status: 404 }
      );
    }

    if (existing.pinnedAt) {
      return NextResponse.json({ pinnedAt: existing.pinnedAt });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const currentPinnedCount = await tx.userJersey.count({
          where: { userId: user.id, pinnedAt: { not: null } },
        });
        if (!canPin(currentPinnedCount)) {
          return { limitReached: true as const };
        }
        const updated = await tx.userJersey.update({
          where: { id },
          data: { pinnedAt: new Date() },
          select: { pinnedAt: true },
        });
        return { limitReached: false as const, pinnedAt: updated.pinnedAt };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    if (result.limitReached) {
      return NextResponse.json(
        { error: `Limite de ${MAX_PINS} maillots épinglés atteinte`, code: "PIN_LIMIT_REACHED" },
        { status: 409 }
      );
    }

    return NextResponse.json({ pinnedAt: result.pinnedAt });
  } catch (error) {
    console.error("Erreur POST /api/user-jerseys/[id]/pin:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté" },
        { status: 401 }
      );
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const existing = await prisma.userJersey.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Maillot introuvable dans votre collection" },
        { status: 404 }
      );
    }

    await prisma.userJersey.update({
      where: { id },
      data: { pinnedAt: null },
    });

    return NextResponse.json({ pinnedAt: null });
  } catch (error) {
    console.error("Erreur DELETE /api/user-jerseys/[id]/pin:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
