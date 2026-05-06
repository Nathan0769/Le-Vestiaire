import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/check-permission";
import {
  strictRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

const CfsPromoUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  imageUrl: z.string().url().optional(),
  price: z.number().positive().optional(),
  promoPrice: z.number().positive().optional(),
  affiliateUrl: z.string().url().optional(),
  club: z.string().max(100).nullable().optional(),
  brand: z.string().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireRole(["superadmin"]);
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(strictRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = CfsPromoUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.cfsPromo.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Promo introuvable" }, { status: 404 });
    }

    const promo = await prisma.cfsPromo.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ promo });
  } catch (err) {
    console.error("PUT /api/admin/cfs-promos/[id] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireRole(["superadmin"]);
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(strictRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const { id } = await params;

    const existing = await prisma.cfsPromo.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Promo introuvable" }, { status: 404 });
    }

    await prisma.cfsPromo.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/cfs-promos/[id] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
