import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { getFeedAroundPost } from "@/lib/feed/get-feed-around";
import { enrichPostsForFeed } from "@/lib/feed/enrich-posts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { postId } = await params;
  const { searchParams } = new URL(request.url);
  const beforeLimit = Math.min(
    parseInt(searchParams.get("before") ?? "10", 10) || 10,
    50
  );
  const afterLimit = Math.min(
    parseInt(searchParams.get("after") ?? "10", 10) || 10,
    50
  );

  const { newer, target, older, hasMoreNewer, hasMoreOlder } =
    await getFeedAroundPost(user.id, postId, { beforeLimit, afterLimit });

  if (!target) {
    return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
  }

  // Enrichir tous les posts d'un coup (moins de queries)
  const allPosts = [...newer, target, ...older];
  const enriched = await enrichPostsForFeed(allPosts, user.id);
  const enrichedById = new Map(enriched.map((p) => [p.id, p]));

  return NextResponse.json({
    newer: newer.map((p) => enrichedById.get(p.id)).filter(Boolean),
    target: enrichedById.get(target.id) ?? null,
    older: older.map((p) => enrichedById.get(p.id)).filter(Boolean),
    hasMoreNewer,
    hasMoreOlder,
    newerCursor: newer.length > 0 ? newer[0].id : null,
    olderCursor: older.length > 0 ? older[older.length - 1].id : null,
  });
}
