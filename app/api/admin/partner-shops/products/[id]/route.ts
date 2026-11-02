import { NextResponse } from "next/server";
import { JerseyType } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { rematchPartnerProducts } from "@/lib/partner-shops/matcher";

const PatchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("link"),
    clubId: z.string().min(1).max(100),
    season: z.string().regex(/^\d{4}(-\d{2})?$/),
    type: z.nativeEnum(JerseyType),
  }),
  z.object({ action: z.literal("ignore") }),
  z.object({ action: z.literal("reset") }),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(["superadmin"]);
  if (error) return error;

  try {
    const { id } = await params;
    const parsed = PatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const product = await prisma.partnerProduct.findUnique({
      where: { id },
      select: { id: true, shop: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const body = parsed.data;
    if (body.action === "link") {
      const jersey = await prisma.jersey.findFirst({
        where: { clubId: body.clubId, season: body.season, type: body.type },
        orderBy: { variant: "asc" },
        select: { id: true },
      });
      if (!jersey) {
        return NextResponse.json(
          { error: "Aucun maillot pour ce club, cette saison et ce type" },
          { status: 404 }
        );
      }
      await prisma.partnerProduct.update({
        where: { id },
        data: { jerseyId: jersey.id, matchStatus: "MANUAL" },
      });
    } else if (body.action === "ignore") {
      await prisma.partnerProduct.update({
        where: { id },
        data: { jerseyId: null, matchStatus: "IGNORED" },
      });
    } else {
      await rematchPartnerProducts(product.shop, [id]);
    }

    const updated = await prisma.partnerProduct.findUnique({
      where: { id },
      select: { id: true, matchStatus: true, jerseyId: true },
    });
    return NextResponse.json({ product: updated });
  } catch (err) {
    console.error("PATCH /api/admin/partner-shops/products/[id] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
