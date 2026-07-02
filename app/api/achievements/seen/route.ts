import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimit = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastAchievementsSeenAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
