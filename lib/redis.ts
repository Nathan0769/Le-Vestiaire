import { Redis } from "@upstash/redis";

/**
 * Client Redis Upstash partagé (Vercel KV).
 * Réutilise les variables KV_REST_API_URL / KV_REST_API_TOKEN.
 * Déclaré au niveau module pour bénéficier du caching des edge functions.
 */
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
