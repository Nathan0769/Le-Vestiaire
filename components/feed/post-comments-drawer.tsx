"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { FeedPostItem } from "@/types/feed";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CommentItem, type CommentEntity } from "@/components/feed/comment-item";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { trackEvent } from "@/lib/analytics";

interface PostCommentsDrawerProps {
  post: FeedPostItem;
  open: boolean;
  onClose: () => void;
}

interface CommentsPage {
  items: CommentEntity[];
  nextCursor: string | null;
}

export function PostCommentsDrawer({
  post,
  open,
  onClose,
}: PostCommentsDrawerProps) {
  const t = useTranslations("Feed.comments");
  const [draft, setDraft] = useState("");
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();

  const comments = useInfiniteQuery({
    queryKey: ["comments", post.id],
    enabled: open,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: CommentsPage) => last.nextCursor ?? undefined,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set("cursor", pageParam);
      const res = await fetch(
        `/api/posts/${post.id}/comments?${params.toString()}`
      );
      if (!res.ok) throw new Error("comments fetch error");
      return (await res.json()) as CommentsPage;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "post error");
      }
    },
    onSuccess: () => {
      trackEvent({
        name: "post_commented",
        params: { post_type: post.type, content_length: draft.length },
      });
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const allComments = comments.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>
            {t("title")} {post.commentCount > 0 && `(${post.commentCount})`}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {comments.isLoading && (
            <p className="text-sm text-muted-foreground py-4">
              {t("loading")}
            </p>
          )}
          {!comments.isLoading && allComments.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {t("empty")}
            </p>
          )}
          <div className="divide-y divide-border">
            {allComments.map((comment) => (
              <CommentItem
                key={comment.id}
                postId={post.id}
                comment={comment}
                currentUserId={currentUser?.id}
                postAuthorId={post.author?.id ?? ""}
              />
            ))}
          </div>
          {comments.hasNextPage && (
            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => comments.fetchNextPage()}
                disabled={comments.isFetchingNextPage}
                className="cursor-pointer w-full"
              >
                {comments.isFetchingNextPage
                  ? t("showMoreLoading")
                  : t("showMore")}
              </Button>
            </div>
          )}
        </div>

        {currentUser && (
          <div className="border-t border-border p-4 space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("placeholder")}
              maxLength={500}
              className="min-h-16 text-sm"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {t("counter", { count: draft.length })}
              </p>
              <Button
                size="sm"
                onClick={() => createMutation.mutate(draft.trim())}
                disabled={
                  createMutation.isPending || draft.trim().length === 0
                }
                className="cursor-pointer"
              >
                {t("publish")}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
