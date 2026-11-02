import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { revalidateJerseysByIds } from "@/lib/catalog-revalidation";
import { normalizeClubName } from "@/lib/partner-shops/club-name";
import { rematchPartnerProducts } from "@/lib/partner-shops/matcher";
import { getPartnerShop } from "@/lib/partner-shops/shops";
import { parsePartnerTitle } from "@/lib/partner-shops/title-parser";

const CreateAliasSchema = z.object({
  shop: z.string().min(1).max(100),
  externalName: z.string().trim().min(1).max(200),
  clubId: z.string().min(1).max(100),
});

export async function GET(request: Request) {
  const { error } = await requireRole(["superadmin"]);
  if (error) return error;

  try {
    const shop = new URL(request.url).searchParams.get("shop") ?? "";
    if (!getPartnerShop(shop)) {
      return NextResponse.json({ error: "Boutique inconnue" }, { status: 400 });
    }
    const aliases = await prisma.partnerClubAlias.findMany({
      where: { shop },
      include: { club: { select: { id: true, name: true } } },
      orderBy: { externalName: "asc" },
    });
    return NextResponse.json({ aliases });
  } catch (err) {
    console.error("GET /api/admin/partner-shops/aliases error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await requireRole(["superadmin"]);
  if (error) return error;

  try {
    const parsed = CreateAliasSchema.safeParse(await request.json());
    if (!parsed.success || !getPartnerShop(parsed.data.shop)) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    const { shop, externalName, clubId } = parsed.data;

    const alias = await prisma.partnerClubAlias.create({
      data: { shop, externalName, clubId },
      include: { club: { select: { id: true, name: true } } },
    });

    // Rejoue le matching des produits en attente de ce club.
    const key = normalizeClubName(externalName);
    const pending = await prisma.partnerProduct.findMany({
      where: { shop, matchStatus: "NEEDS_ALIAS", removedAt: null },
      select: { id: true, title: true },
    });
    const ids = pending
      .filter((p) => {
        const club = parsePartnerTitle(p.title, "Maillot").club;
        return club !== null && normalizeClubName(club) === key;
      })
      .map((p) => p.id);
    const rematched = await rematchPartnerProducts(shop, ids);
    const linked = await prisma.partnerProduct.findMany({
      where: { id: { in: ids }, jerseyId: { not: null } },
      select: { jerseyId: true },
    });
    await revalidateJerseysByIds([...new Set(linked.map((p) => p.jerseyId!))]);

    return NextResponse.json({ alias, rematched, evaluated: ids.length }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Alias déjà existant" }, { status: 409 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json({ error: "Club introuvable" }, { status: 400 });
    }
    console.error("POST /api/admin/partner-shops/aliases error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
