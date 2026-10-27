import { requireRole } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { revalidateJerseyPages } from "@/lib/catalog-revalidation";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(["superadmin"]);
  if (error) return error;

  const { id } = await params;

  const jersey = await prisma.jersey.findUnique({
    where: { id },
    select: { id: true, slug: true, clubId: true, club: { select: { leagueId: true } } },
  });
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

  revalidateJerseyPages({ ...jersey, leagueId: jersey.club.leagueId });

  return NextResponse.json({ success: true });
}
