"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS, es, it, de, nl, pt } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { MoreVertical, Flag, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostCardJersey } from "@/components/feed/post-card-jersey";
import { PostCardAchievement } from "@/components/feed/post-card-achievement";
import { PostCardCap } from "@/components/feed/post-card-cap";
import { PostActions } from "@/components/feed/post-actions";
import { PostCommentsDrawer } from "@/components/feed/post-comments-drawer";
import { PostReportModal } from "@/components/moderation/post-report-modal";
import { LikersPreview } from "@/components/feed/likers-preview";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFollow } from "@/hooks/useFollow";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  FeedPostItem,
  JerseyAddPayload,
  AchievementUnlockPayload,
  CapReachedPayload,
} from "@/types/feed";

interface PostCardProps {
  post: FeedPostItem;
}

const DATE_LOCALES: Record<string, typeof fr> = {
  fr, en: enUS, es, it, de, nl, pt,
};

export function PostCard({ post }: PostCardProps) {
  const t = useTranslations("Feed.post");
  const locale = useLocale();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();

  const deletePost = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  if (!post.author) return null;
  // Payload null = ressource référencée (userJersey / achievement) supprimée depuis.
  // On skip pour éviter une card cassée.
  if (post.payload === null) return null;

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: DATE_LOCALES[locale] ?? fr,
  });

  const isOwnPost = currentUser?.id === post.author.id;

  return (
    <article className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <header className="flex items-center gap-3 px-3 py-2.5">
        <Link
          href={`/u/${post.author.username}`}
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
        >
          <UserAvatar
            src={post.author.avatarUrl ?? undefined}
            name={post.author.name}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate group-hover:underline">
              @{post.author.username}
            </p>
            {post.author.favoriteClubName && (
              <p className="text-xs text-muted-foreground truncate">
                {post.author.favoriteClubName}
              </p>
            )}
          </div>
        </Link>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {timeAgo}
        </span>
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="cursor-pointer h-8 w-8 p-0"
                aria-label={t("options")}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwnPost ? (
                <DropdownMenuItem
                  onClick={() => deletePost.mutate()}
                  disabled={deletePost.isPending}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("delete")}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => setReportOpen(true)}
                  className="cursor-pointer"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  {t("report")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      {post.type === "JERSEY_ADD" && post.payload && (
        <PostCardJersey payload={post.payload as JerseyAddPayload} />
      )}
      {post.type === "ACHIEVEMENT_UNLOCK" && post.payload && (
        <div className="px-4 pb-4">
          <PostCardAchievement payload={post.payload as AchievementUnlockPayload} />
        </div>
      )}
      {post.type === "CAP_REACHED" && post.payload && (
        <div className="px-4 pb-4">
          <PostCardCap payload={post.payload as CapReachedPayload} />
        </div>
      )}

      <div className="px-3 pb-2 space-y-1.5">
        {(post.likeCount > 0 || post.commentCount > 0) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <LikersPreview
              likers={post.likersPreview}
              totalCount={post.likeCount}
            />
            {post.commentCount > 0 && (
              <button
                onClick={() => setCommentsOpen(true)}
                className="hover:underline cursor-pointer"
              >
                {post.commentCount === 1
                  ? t("commentSingle")
                  : t("commentMany", { count: post.commentCount })}
              </button>
            )}
          </div>
        )}
        <div className="border-t border-border pt-1 flex items-center justify-between gap-2">
          <PostActions
            post={post}
            onCommentClick={() => setCommentsOpen(true)}
          />
          {currentUser && !isOwnPost && (
            <FollowInline
              targetId={post.author.id}
              alreadyFollowing={post.isFollowingAuthor}
            />
          )}
        </div>
      </div>

      {commentsOpen && (
        <PostCommentsDrawer
          post={post}
          open={commentsOpen}
          onClose={() => setCommentsOpen(false)}
        />
      )}
      {reportOpen && (
        <PostReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType="POST"
          postId={post.id}
        />
      )}
    </article>
  );
}

function FollowInline({
  targetId,
  alreadyFollowing,
}: {
  targetId: string;
  alreadyFollowing: boolean;
}) {
  const t = useTranslations("Feed");
  const { follow, loading } = useFollow();
  const [state, setState] = useState<"none" | "following" | "requested">(
    alreadyFollowing ? "following" : "none"
  );

  if (state === "following") return null;

  if (state === "requested") {
    return (
      <span className="text-xs font-semibold text-muted-foreground px-2">
        {t("recommendedRequested")}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        const res = await follow(targetId, "feed");
        if (res.success) setState(res.status);
      }}
      className="text-xs font-semibold text-primary hover:opacity-70 cursor-pointer disabled:opacity-40 px-2"
    >
      {t("recommendedFollow")}
    </button>
  );
}
