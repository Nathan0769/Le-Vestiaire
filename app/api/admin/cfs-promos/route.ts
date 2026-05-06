import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/check-permission";
import {
  strictRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

const CfsPromoSchema = z.object({
  name: z.string().min(1).max(200),
  imageUrl: z.string().url(),
  price: z.number().positive(),
  promoPrice: z.number().positive(),
  affiliateUrl: z.string().url(),
  club: z.string().max(100).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export async function GET() {
  const { error, session } = await requireRole(["superadmin"]);
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(strictRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const promos = await prisma.cfsPromo.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ promos });
  } catch (err) {
    console.error("GET /api/admin/cfs-promos error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireRole(["superadmin"]);
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(strictRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = CfsPromoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const promo = await prisma.cfsPromo.create({
      data: {
        name: parsed.data.name,
        imageUrl: parsed.data.imageUrl,
        price: parsed.data.price,
        promoPrice: parsed.data.promoPrice,
        affiliateUrl: parsed.data.affiliateUrl,
        club: parsed.data.club ?? null,
        brand: parsed.data.brand ?? null,
        isActive: parsed.data.isActive ?? true,
        position: parsed.data.position ?? 0,
      },
    });

    return NextResponse.json({ promo }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/cfs-promos error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
