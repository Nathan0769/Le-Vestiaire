import { getCurrentUser } from "@/lib/get-current-user";
import {
  socialActionRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { CommentError, toggleCommentLike } from "@/lib/feed/comments";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(socialActionRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { id: postId, commentId } = await params;

  try {
    const result = await toggleCommentLike({
      postId,
      commentId,
      userId: user.id,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CommentError) {
      return error.code === "BLOCKED"
        ? NextResponse.json({ error: "Interaction bloquée" }, { status: 403 })
        : NextResponse.json(
            { error: "Commentaire introuvable" },
            { status: 404 }
          );
    }
    throw error;
  }
}
