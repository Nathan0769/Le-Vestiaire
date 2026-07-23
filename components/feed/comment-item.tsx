"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS, es, it, de, nl, pt } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MoreVertical, Pencil, Trash2, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
}

export interface CommentEntity {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
}

interface CommentItemProps {
  postId: string;
  comment: CommentEntity;
  currentUserId?: string | null;
  postAuthorId: string;
}

export function CommentItem({
  postId,
  comment,
  currentUserId,
  postAuthorId,
}: CommentItemProps) {
  const t = useTranslations("Feed.comments");
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  return (
    <div className="flex items-start gap-3 py-2">
      <Link
        href={`/u/${comment.author.username}`}
        className="cursor-pointer flex-shrink-0"
      >
        <UserAvatar
          src={comment.author.avatarUrl ?? undefined}
          name={comment.author.name}
          size="sm"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <Link
            href={`/u/${comment.author.username}`}
            className="font-medium text-sm cursor-pointer hover:underline"
          >
            {comment.author.name}
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
      </div>
      {(canEdit || canDelete || canReport) && !editing && (
        <DropdownMenu>
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
  );
}
