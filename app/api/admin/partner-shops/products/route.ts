import { NextResponse } from "next/server";
import { PartnerMatchStatus } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { getPartnerShop } from "@/lib/partner-shops/shops";
import { parsePartnerTitle } from "@/lib/partner-shops/title-parser";

const PAGE_SIZE = 50;

const QuerySchema = z.object({
  shop: z.string().min(1).max(100),
  status: z.nativeEnum(PartnerMatchStatus).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

export async function GET(request: Request) {
  const { error } = await requireRole(["superadmin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success || !getPartnerShop(parsed.data.shop)) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }
    const { shop, status, page } = parsed.data;
    const where = { shop, removedAt: null, ...(status ? { matchStatus: status } : {}) };

    const [products, total, counts] = await Promise.all([
      prisma.partnerProduct.findMany({
        where,
        orderBy: { title: "asc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          title: true,
          url: true,
          imageUrl: true,
          price: true,
          available: true,
          matchStatus: true,
          jersey: {
            select: { id: true, season: true, type: true, club: { select: { name: true } } },
          },
        },
      }),
      prisma.partnerProduct.count({ where }),
      prisma.partnerProduct.groupBy({
        by: ["matchStatus"],
        where: { shop, removedAt: null },
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      products: products.map((p) => {
        // Seuls les maillots sont stockés : le titre suffit à préremplir club, saison et type.
        const { club, season, type } = parsePartnerTitle(p.title, "Maillot");
        return { ...p, price: Number(p.price), parsed: { club, season, type } };
      }),
      total,
      pageSize: PAGE_SIZE,
      counts: Object.fromEntries(counts.map((c) => [c.matchStatus, c._count._all])),
    });
  } catch (err) {
    console.error("GET /api/admin/partner-shops/products error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
