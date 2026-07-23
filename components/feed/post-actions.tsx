"use client";

import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trackEvent } from "@/lib/analytics";
import type { FeedPostItem } from "@/types/feed";

interface PostActionsProps {
  post: FeedPostItem;
  onCommentClick: () => void;
}

export function PostActions({ post, onCommentClick }: PostActionsProps) {
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [hasLiked, setHasLiked] = useState(post.hasLiked);
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur like");
      return (await res.json()) as { hasLiked: boolean; likeCount: number };
    },
    onMutate: () => {
      const previous = { hasLiked, likeCount };
      setHasLiked(!hasLiked);
      setLikeCount(likeCount + (hasLiked ? -1 : 1));
      return previous;
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) {
        setHasLiked(ctx.hasLiked);
        setLikeCount(ctx.likeCount);
      }
    },
    onSuccess: (data) => {
      setHasLiked(data.hasLiked);
      setLikeCount(data.likeCount);
      trackEvent({
        name: "post_liked",
        params: { post_type: post.type },
      });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => likeMutation.mutate()}
        disabled={likeMutation.isPending}
        className="gap-1.5 cursor-pointer"
      >
        <Heart
          className={`w-5 h-5 ${
            hasLiked ? "fill-red-500 text-red-500" : ""
          }`}
        />
        <span className="text-sm">{likeCount}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCommentClick}
        className="gap-1.5 cursor-pointer"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm">{post.commentCount}</span>
      </Button>
    </div>
  );
}
