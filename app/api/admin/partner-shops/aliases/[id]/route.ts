import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/check-permission";
import prisma from "@/lib/prisma";

// Les produits déjà reliés gardent leur maillot : seul le matching futur change.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(["superadmin"]);
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.partnerClubAlias.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Alias introuvable" }, { status: 404 });
    }
    console.error("DELETE /api/admin/partner-shops/aliases/[id] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
