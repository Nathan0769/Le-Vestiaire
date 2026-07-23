"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

type ReportStatus = "PENDING" | "REVIEWED_KEPT" | "REVIEWED_REMOVED";
type ReportTargetType = "POST" | "COMMENT";

interface AdminReport {
  id: string;
  targetType: ReportTargetType;
  reason: string;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  totalReports: number;
  reporter: { id: string; username: string; name: string };
  post: {
    id: string;
    type: string;
    deletedAt: string | null;
    author: { id: string; username: string; name: string };
  } | null;
  comment: {
    id: string;
    content: string;
    deletedAt: string | null;
    postId: string;
    author: { id: string; username: string; name: string };
  } | null;
}

export function CommunityReportsTable() {
  const t = useTranslations("Moderation");
  const tAdmin = useTranslations("Moderation.admin");
  const [status, setStatus] = useState<ReportStatus>("PENDING");
  const [targetType, setTargetType] = useState<ReportTargetType | "ALL">("ALL");
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-post-reports", { status, targetType }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("status", status);
      if (targetType !== "ALL") params.set("targetType", targetType);
      const res = await fetch(`/api/admin/post-reports?${params.toString()}`);
      if (!res.ok) throw new Error("load error");
      return (await res.json()) as { items: AdminReport[] };
    },
  });

  const review = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: "keep" | "remove";
    }) => {
      const res = await fetch(`/api/admin/post-reports/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("review error");
    },
    onSuccess: (_data, { action }) => {
      toast.success(
        action === "remove" ? tAdmin("toastRemoved") : tAdmin("toastKept")
      );
      queryClient.invalidateQueries({ queryKey: ["admin-post-reports"] });
    },
    onError: () => toast.error(tAdmin("toastError")),
  });

  const items = query.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["PENDING", "REVIEWED_KEPT", "REVIEWED_REMOVED"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={status === s ? "default" : "outline"}
            onClick={() => setStatus(s)}
            className="cursor-pointer"
          >
            {s === "PENDING"
              ? tAdmin("filterStatusPending")
              : s === "REVIEWED_KEPT"
              ? tAdmin("filterStatusKept")
              : tAdmin("filterStatusRemoved")}
          </Button>
        ))}
        <div className="flex-1" />
        {(["ALL", "POST", "COMMENT"] as const).map((tt) => (
          <Button
            key={tt}
            size="sm"
            variant={targetType === tt ? "default" : "outline"}
            onClick={() => setTargetType(tt)}
            className="cursor-pointer"
          >
            {tt === "ALL"
              ? tAdmin("filterTargetAll")
              : tt === "POST"
              ? tAdmin("filterTargetPost")
              : tAdmin("filterTargetComment")}
          </Button>
        ))}
      </div>

      {query.isLoading && (
        <p className="text-sm text-muted-foreground">{tAdmin("loading")}</p>
      )}
      {!query.isLoading && items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {tAdmin("empty")}
        </p>
      )}

      <div className="space-y-3">
        {items.map((r) => {
          const targetAuthor = r.post?.author ?? r.comment?.author;
          const targetDeleted = r.post?.deletedAt || r.comment?.deletedAt;
          return (
            <div
              key={r.id}
              className="border border-border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge>{r.targetType}</Badge>
                    <Badge variant="outline">
                      {t(`reasons.${r.reason}` as never)}
                    </Badge>
                    {r.totalReports > 1 && (
                      <Badge variant="destructive">
                        {tAdmin("totalReports", { count: r.totalReports })}
                      </Badge>
                    )}
                    {targetDeleted && (
                      <Badge variant="secondary">{tAdmin("alreadyDeleted")}</Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mt-2">
                    {tAdmin("reportedBy")}{" "}
                    <Link
                      href={`/u/${r.reporter.username}`}
                      className="underline cursor-pointer"
                    >
                      @{r.reporter.username}
                    </Link>
                    {targetAuthor && (
                      <>
                        {" · "}
                        {tAdmin("target")}
                        {" : "}
                        <Link
                          href={`/u/${targetAuthor.username}`}
                          className="underline cursor-pointer"
                        >
                          @{targetAuthor.username}
                        </Link>
                      </>
                    )}
                  </p>

                  {r.comment && (
                    <blockquote className="mt-2 text-sm border-l-2 border-border pl-3 whitespace-pre-wrap break-words">
                      {r.comment.content}
                    </blockquote>
                  )}

                  {r.details && (
                    <p className="mt-2 text-sm">
                      <span className="font-medium">{tAdmin("details")} : </span>
                      {r.details}
                    </p>
                  )}
                </div>
              </div>

              {status === "PENDING" && !targetDeleted && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={review.isPending}
                    onClick={() =>
                      review.mutate({ id: r.id, action: "remove" })
                    }
                    className="cursor-pointer"
                  >
                    {tAdmin("actionRemove")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={review.isPending}
                    onClick={() =>
                      review.mutate({ id: r.id, action: "keep" })
                    }
                    className="cursor-pointer"
                  >
                    {tAdmin("actionKeep")}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
