import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  strictRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";

const betterAuthHandler = toNextJsHandler(auth);

export async function GET(request: NextRequest) {
  return betterAuthHandler.GET(request);
}

export async function POST(request: NextRequest) {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(strictRateLimit, identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  return betterAuthHandler.POST(request);
}
