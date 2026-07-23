"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";

type Reason = "SPAM" | "HARASSMENT" | "HATE_SPEECH" | "INAPPROPRIATE" | "OTHER";

const ALL_REASONS: Reason[] = ["SPAM", "HARASSMENT", "HATE_SPEECH", "INAPPROPRIATE", "OTHER"];

interface PostReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: "POST" | "COMMENT";
  postId?: string;
  commentId?: string;
}

export function PostReportModal({
  open,
  onClose,
  targetType,
  postId,
  commentId,
}: PostReportModalProps) {
  const t = useTranslations("Moderation");
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!reason) throw new Error("reason required");
      const res = await fetch("/api/post-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          postId,
          commentId,
          reason,
          details: details.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "report error");
      }
    },
    onSuccess: () => {
      trackEvent({
        name: "post_reported",
        params: { target_type: targetType, reason: reason ?? "OTHER" },
      });
      toast.success(t("success"));
      onClose();
      setReason(null);
      setDetails("");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t("genericError"));
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {targetType === "POST" ? t("reportPost") : t("reportComment")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("reason")}</Label>
            <div className="grid grid-cols-1 gap-2">
              {ALL_REASONS.map((r) => (
                <Button
                  key={r}
                  variant={reason === r ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReason(r)}
                  className="justify-start cursor-pointer"
                >
                  {t(`reasons.${r}` as never)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-details">{t("details")}</Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
              className="min-h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
            className="cursor-pointer"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!reason || mutation.isPending}
            className="cursor-pointer"
          >
            {mutation.isPending ? t("submitting") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
