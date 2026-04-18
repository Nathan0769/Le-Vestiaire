import { requireRole } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(["superadmin"]);
  if (error) return error;

  const { id } = await params;

  const jersey = await prisma.jersey.findUnique({ where: { id } });
  if (!jersey) {
    return NextResponse.json({ error: "Maillot introuvable" }, { status: 404 });
  }

  // Suppression en cascade manuelle (pas de onDelete: Cascade dans le schema)
  await prisma.$transaction([
    prisma.rating.deleteMany({ where: { jerseyId: id } }),
    prisma.wishlist.deleteMany({ where: { jerseyId: id } }),
    prisma.userJersey.deleteMany({ where: { jerseyId: id } }),
    prisma.descriptionProposal.deleteMany({ where: { jerseyId: id } }),
    prisma.jersey.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
