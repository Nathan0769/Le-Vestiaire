import { requirePermission } from "@/lib/check-permission";
import { moderateRateLimit, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/** Marque une erreur résolue. Si elle revient, `recordErrorEvent` la rouvre. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requirePermission({ errorEvent: ["manage"] });
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { id } = await params;
  const { count } = await prisma.errorEvent.updateMany({
    where: { id },
    data: { resolvedAt: new Date() },
  });
  if (count === 0) {
    return NextResponse.json({ error: "Erreur introuvable" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
