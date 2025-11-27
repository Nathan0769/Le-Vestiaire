import { getCurrentUser } from "@/lib/get-current-user";
import {
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateBrandSchema = z.object({
  brand: z.string().min(1, "La marque ne peut pas être vide").max(100),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Accès refusé. Droits administrateur requis." },
        { status: 403 }
      );
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    // 4. Input Validation
    const body = await request.json();
    const validation = updateBrandSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id } = await params;

    const jersey = await prisma.jersey.findUnique({
      where: { id },
    });

    if (!jersey) {
      return NextResponse.json(
        { error: "Maillot introuvable" },
        { status: 404 }
      );
    }

    const updatedJersey = await prisma.jersey.update({
      where: { id },
      data: {
        brand: validation.data.brand,
      },
    });

    return NextResponse.json({
      success: true,
      brand: updatedJersey.brand,
    });
  } catch (error) {
    console.error("Error updating jersey brand:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la marque" },
      { status: 500 }
    );
  }
}
