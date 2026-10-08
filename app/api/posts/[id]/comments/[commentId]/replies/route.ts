import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { listComments } from "@/lib/feed/comments";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const user = await getCurrentUser();

  const identifier = await getRateLimitIdentifier(user?.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { id: postId, commentId } = await params;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;

  const parent = await prisma.postComment.findFirst({
    where: {
      id: commentId,
      postId,
      parentId: null,
      deletedAt: null,
      post: { deletedAt: null },
    },
    select: { id: true },
  });
  if (!parent) {
    return NextResponse.json(
      { error: "Commentaire introuvable" },
      { status: 404 }
    );
  }

  const page = await listComments({
    postId,
    parentId: parent.id,
    viewerId: user?.id ?? null,
    cursor,
  });

  return NextResponse.json(page);
}
