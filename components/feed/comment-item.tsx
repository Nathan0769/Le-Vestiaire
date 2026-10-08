"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS, es, it, de, nl, pt } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { SupporterName } from "@/components/supporter/supporter-name";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MoreVertical, Pencil, Trash2, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { PostReportModal } from "@/components/moderation/post-report-modal";

const EDIT_WINDOW_MS = 15 * 60 * 1000;
const DATE_LOCALES: Record<string, typeof fr> = {
  fr, en: enUS, es, it, de, nl, pt,
};

export interface CommentAuthor {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  isSupporter?: boolean;
  avatarFrame?: string | null;
}

export interface CommentEntity {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  likeCount: number;
  replyCount: number;
  hasLiked: boolean;
  author: CommentAuthor;
}

export interface CommentsPage {
  items: CommentEntity[];
  nextCursor: string | null;
}

export interface ReplyTarget {
  /** Commentaire visé (racine ou réponse) : le serveur le ramène à sa racine. */
  commentId: string;
  /** Racine du fil, pour déplier ses réponses après l'envoi. */
  rootId: string;
  username: string;
}

interface CommentItemProps {
  postId: string;
  comment: CommentEntity;
  currentUserId?: string | null;
  postAuthorId: string;
  onReply: (target: ReplyTarget) => void;
  /** Racines uniquement : état du fil de réponses, tenu par le drawer. */
  repliesExpanded?: boolean;
  onToggleReplies?: () => void;
}

export function CommentItem({
  postId,
  comment,
  currentUserId,
  postAuthorId,
  onReply,
  repliesExpanded = false,
  onToggleReplies,
}: CommentItemProps) {
  const t = useTranslations("Feed.comments");
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [hasLiked, setHasLiked] = useState(comment.hasLiked);
  const queryClient = useQueryClient();

  const isReply = comment.parentId !== null;
  const isOwnComment = currentUserId === comment.author.id;
  const canDelete = isOwnComment || currentUserId === postAuthorId;
  const canReport = Boolean(currentUserId) && !isOwnComment;
  // State initialisé au 1er render client (useState lazy init) : évite le mismatch
  // SSR (Date.now diverge server/client) sans passer par useEffect.
  const [withinEditWindow] = useState(
    () =>
      typeof window !== "undefined" &&
      Date.now() - new Date(comment.createdAt).getTime() < EDIT_WINDOW_MS
  );
  const canEdit = isOwnComment && withinEditWindow;

  const editMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(
        `/api/posts/${postId}/comments/${comment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
      if (!res.ok) throw new Error("edit error");
    },
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["comment-replies"] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/posts/${postId}/comments/${comment.id}/like`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("like error");
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
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/posts/${postId}/comments/${comment.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("delete error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["comment-replies"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  return (
    <div className="py-2">
      <div className="flex items-start gap-3">
        <Link
          href={`/u/${comment.author.username}`}
          className="cursor-pointer flex-shrink-0"
        >
          <UserAvatar
            src={comment.author.avatarUrl ?? undefined}
            name={comment.author.name}
            size="sm"
            frame={comment.author.avatarFrame}
            isSupporter={comment.author.isSupporter}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <Link
              href={`/u/${comment.author.username}`}
              className="font-medium text-sm cursor-pointer hover:underline"
            >
              <SupporterName
                name={comment.author.name}
                isSupporter={comment.author.isSupporter}
              />
            </Link>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: DATE_LOCALES[locale] ?? fr,
              })}
            </span>
          </div>
          {editing ? (
            <div className="mt-1 space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={500}
                className="min-h-16 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => editMutation.mutate(draft)}
                  disabled={
                    editMutation.isPending ||
                    draft.trim().length === 0 ||
                    draft === comment.content
                  }
                  className="cursor-pointer"
                >
                  {t("save")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDraft(comment.content);
                    setEditing(false);
                  }}
                  className="cursor-pointer"
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          )}
          {currentUserId && !editing && (
            <button
              type="button"
              onClick={() =>
                onReply({
                  commentId: comment.id,
                  rootId: comment.parentId ?? comment.id,
                  username: comment.author.username,
                })
              }
              className="mt-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {t("reply")}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => likeMutation.mutate()}
          disabled={!currentUserId || likeMutation.isPending}
          aria-label={t("like")}
          aria-pressed={hasLiked}
          className="flex flex-col items-center gap-0.5 pt-1 min-w-6 text-muted-foreground cursor-pointer disabled:cursor-default"
        >
          <Heart
            className={`w-4 h-4 ${hasLiked ? "fill-red-500 text-red-500" : ""}`}
          />
          {likeCount > 0 && <span className="text-[11px]">{likeCount}</span>}
        </button>
        {(canEdit || canDelete || canReport) && !editing && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="cursor-pointer h-8 w-8 p-0"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem
                  onClick={() => setEditing(true)}
                  className="cursor-pointer"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  {t("edit")}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("delete")}
                </DropdownMenuItem>
              )}
              {canReport && (
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
        {reportOpen && (
          <PostReportModal
            open={reportOpen}
            onClose={() => setReportOpen(false)}
            targetType="COMMENT"
            commentId={comment.id}
          />
        )}
      </div>
      {!isReply && comment.replyCount > 0 && onToggleReplies && (
        <div className="pl-11">
          <button
            type="button"
            onClick={onToggleReplies}
            className="mt-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {repliesExpanded
              ? t("hideReplies")
              : t("viewReplies", { count: comment.replyCount })}
          </button>
          {repliesExpanded && (
            <CommentReplies
              postId={postId}
              parentId={comment.id}
              currentUserId={currentUserId}
              postAuthorId={postAuthorId}
              onReply={onReply}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface CommentRepliesProps {
  postId: string;
  parentId: string;
  currentUserId?: string | null;
  postAuthorId: string;
  onReply: (target: ReplyTarget) => void;
}

function CommentReplies({
  postId,
  parentId,
  currentUserId,
  postAuthorId,
  onReply,
}: CommentRepliesProps) {
  const t = useTranslations("Feed.comments");

  const replies = useInfiniteQuery({
    queryKey: ["comment-replies", parentId],
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: CommentsPage) => last.nextCursor ?? undefined,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set("cursor", pageParam);
      const res = await fetch(
        `/api/posts/${postId}/comments/${parentId}/replies?${params.toString()}`
      );
      if (!res.ok) throw new Error("replies fetch error");
      return (await res.json()) as CommentsPage;
    },
  });

  const items = replies.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div>
      {replies.isLoading && (
        <p className="text-xs text-muted-foreground py-2">{t("loading")}</p>
      )}
      {items.map((reply) => (
        <CommentItem
          key={reply.id}
          postId={postId}
          comment={reply}
          currentUserId={currentUserId}
          postAuthorId={postAuthorId}
          onReply={onReply}
        />
      ))}
      {replies.hasNextPage && (
        <button
          type="button"
          onClick={() => replies.fetchNextPage()}
          disabled={replies.isFetchingNextPage}
          className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {replies.isFetchingNextPage ? t("showMoreLoading") : t("showMore")}
        </button>
      )}
    </div>
  );
}
