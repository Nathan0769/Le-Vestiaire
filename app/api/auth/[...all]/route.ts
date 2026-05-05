import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  strictRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { validatePasswordStrength } from "@/lib/password-validation";

const betterAuthHandler = toNextJsHandler(auth);

const PASSWORD_ENDPOINTS = [
  "/api/auth/sign-up/email",
  "/api/auth/change-password",
  "/api/auth/reset-password",
];

export async function GET(request: NextRequest) {
  return betterAuthHandler.GET(request);
}

export async function POST(request: NextRequest) {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(strictRateLimit, identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { pathname } = new URL(request.url);
  if (PASSWORD_ENDPOINTS.includes(pathname)) {
    try {
      const body = await request.clone().json();
      // sign-up uses "password", change/reset use "newPassword"
      const password: unknown = body.newPassword ?? body.password;
      if (typeof password === "string") {
        const error = validatePasswordStrength(password);
        if (error) {
          return NextResponse.json(
            { error: "Mot de passe trop faible", code: error },
            { status: 400 }
          );
        }
      }
    } catch {
      // body non-JSON ou pas de champ password — laisser Better Auth gérer
    }
  }

  return betterAuthHandler.POST(request);
}
