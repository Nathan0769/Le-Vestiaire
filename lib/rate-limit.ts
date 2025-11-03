import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

/**
 * Configuration Redis depuis les variables d'environnement
 * Utilise KV_REST_API_URL et KV_REST_API_TOKEN de votre .env
 */
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

/**
 * Rate limiters par type d'opération
 * Déclarés en dehors pour bénéficier du caching ("hot" edge functions)
 */

/**
 * STRICT : Pour les opérations critiques (auth, login)
 * 5 requêtes par minute
 */
export const strictRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/strict",
});

/**
 * MODERATE : Pour les uploads et opérations coûteuses
 * 10 requêtes par heure
 */
export const moderateRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
  prefix: "@upstash/ratelimit/moderate",
});

/**
 * STANDARD : Pour les recherches et lectures
 * 20 requêtes par minute
 */
export const standardRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/standard",
});

/**
 * GENEROUS : Pour les endpoints publics (leaderboard, stats)
 * 60 requêtes par minute
 */
export const generousRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/generous",
});

/**
 * PROPOSALS : Pour les propositions de maillots
 * 50 requêtes par heure
 */
export const proposalsRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "1 h"),
  analytics: true,
  prefix: "@upstash/ratelimit/proposals",
});

/**
 * Récupère l'identifiant pour le rate limiting
 * Utilise userId si disponible, sinon l'IP
 */
export async function getRateLimitIdentifier(userId?: string): Promise<string> {
  if (userId) {
    return `user:${userId}`;
  }

  // Récupérer l'IP depuis les headers
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0] || realIp || "127.0.0.1";

  return `ip:${ip}`;
}

/**
 * Type de résultat du rate limiting
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // timestamp en ms
  error?: string;
}

/**
 * Helper pour appliquer le rate limiting dans vos routes API
 *
 * @param ratelimit - L'instance de rate limiter à utiliser
 * @param identifier - L'identifiant (userId ou IP)
 * @returns Résultat du rate limiting
 *
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * const identifier = await getRateLimitIdentifier(user?.id);
 * const result = await checkRateLimit(strictRateLimit, identifier);
 *
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: "Trop de requêtes, réessayez plus tard" },
 *     { status: 429 }
 *   );
 * }
 * ```
 */
export async function checkRateLimit(
  ratelimit: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  try {
    const { success, limit, remaining, reset } =
      await ratelimit.limit(identifier);

    return {
      success,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error("Rate limit error:", error);
    // En cas d'erreur Redis, on laisse passer (fail open)
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
      error: "Rate limit check failed",
    };
  }
}
