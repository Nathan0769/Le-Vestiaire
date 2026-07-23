import { getCurrentUser } from "@/lib/get-current-user";
import {
  socialActionRateLimit,
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { canInteract } from "@/lib/follow";
import { createNotification } from "@/lib/notifications/create";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";

const LIMIT = 20;

const bodySchema = z.object({
  content: z.string().trim().min(1).max(500),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  const identifier = await getRateLimitIdentifier(user?.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { id: postId } = await params;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;

  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: { id: true },
  });
  if (!post) {
    return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
  }

  const rows = await prisma.postComment.findMany({
    where: { postId, deletedAt: null },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          image: true,
        },
      },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: LIMIT + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > LIMIT;
  const sliced = hasMore ? rows.slice(0, LIMIT) : rows;

  const items = await Promise.all(
    sliced.map(async (c) => {
      const avatarUrl = c.author.avatar
        ? await getR2PresignedUrl(AVATARS_BUCKET, c.author.avatar, 60 * 60)
        : null;
      return {
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        author: {
          id: c.author.id,
          username: c.author.username,
          name: c.author.username,
          avatarUrl: avatarUrl ?? c.author.image,
        },
      };
    })
  );

  return NextResponse.json({
    items,
    nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

  const { id: postId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Contenu invalide (1-500 caractères)" },
      { status: 400 }
    );
  }

  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: { id: true, authorId: true, type: true },
  });
  if (!post) {
    return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
  }

  if (!(await canInteract(user.id, post.authorId))) {
    return NextResponse.json({ error: "Interaction bloquée" }, { status: 403 });
  }

  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.postComment.create({
      data: {
        postId: post.id,
        authorId: user.id,
        content: parsed.data.content,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            image: true,
          },
        },
      },
    });
    await tx.post.update({
      where: { id: post.id },
      data: { commentCount: { increment: 1 } },
    });
    await createNotification(
      {
        userId: post.authorId,
        type: "POST_COMMENTED",
        actorId: user.id,
        postId: post.id,
        commentId: created.id,
      },
      tx
    );
    return created;
  });

  const avatarUrl = comment.author.avatar
    ? await getR2PresignedUrl(
        AVATARS_BUCKET,
        comment.author.avatar,
        60 * 60
      )
    : null;

  return NextResponse.json({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: {
      id: comment.author.id,
      username: comment.author.username,
      name: comment.author.username,
      avatarUrl: avatarUrl ?? comment.author.image,
    },
  });
}
