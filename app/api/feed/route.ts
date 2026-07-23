import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { getFeedForUser, type FeedScope } from "@/lib/feed/get-feed";
import { enrichPostsForFeed } from "@/lib/feed/enrich-posts";

const DEFAULT_LIMIT = 20;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const scopeParam = searchParams.get("scope");
  const scope: FeedScope = scopeParam === "global" ? "global" : "friends";
  const limit = Math.min(
    parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) ||
      DEFAULT_LIMIT,
    50
  );

  const { items: posts, nextCursor } = await getFeedForUser(user.id, {
    cursor,
    limit,
    scope,
  });

  const items = await enrichPostsForFeed(posts, user.id);
  return NextResponse.json({ items, nextCursor });
}
