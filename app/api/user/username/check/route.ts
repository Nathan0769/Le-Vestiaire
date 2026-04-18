import { NextRequest, NextResponse } from "next/server";
import { usernameExists, validateUsername } from "@/lib/username-generator";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  // Rate limiting par IP (endpoint public)
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username manquant" }, { status: 400 });
  }

  const validation = validateUsername(username);
  if (!validation.valid) {
    return NextResponse.json({
      available: false,
      error: validation.error,
    });
  }

  const exists = await usernameExists(username);

  return NextResponse.json({
    available: !exists,
    username,
  });
}
