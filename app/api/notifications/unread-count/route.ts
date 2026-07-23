import { getCurrentUser } from "@/lib/get-current-user";
import {
  generousRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(generousRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ count: 0 });
  }

  const [notifCount, followRequestCount] = await Promise.all([
    prisma.notification.count({
      where: { userId: user.id, readAt: null },
    }),
    prisma.followRequest.count({
      where: { targetId: user.id },
    }),
  ]);

  return NextResponse.json({ count: notifCount + followRequestCount });
}
