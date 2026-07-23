"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS, es, it, de, nl, pt } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { NotificationItem as NotificationItemT } from "@/types/notifications";

const DATE_LOCALES: Record<string, typeof fr> = {
  fr, en: enUS, es, it, de, nl, pt,
};

interface Props {
  notification: NotificationItemT;
  onClick?: () => void;
}

export function NotificationItem({ notification, onClick }: Props) {
  const t = useTranslations("Notifications");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [decided, setDecided] = useState<"accepted" | "rejected" | null>(null);

  const accept = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/follow-requests/${id}/accept`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("accept error");
    },
    onSuccess: () => {
      setDecided("accepted");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });

  const reject = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/follow-requests/${id}/reject`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("reject error");
    },
    onSuccess: () => {
      setDecided("rejected");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });

  const isFollowRequest = notification.type === "FOLLOW_REQUEST_RECEIVED";
  const actor = notification.actor;

  const label = isFollowRequest
    ? t("types.FOLLOW_REQUEST_RECEIVED")
    : t(`types.${notification.type}` as never);

  const href =
    notification.postId
      ? `/feed?post=${notification.postId}`
      : actor
      ? `/u/${actor.username}`
      : "/notifications";

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: DATE_LOCALES[locale] ?? fr,
  });

  const content = (
    <>
      {actor ? (
        <UserAvatar
          src={actor.avatarUrl ?? undefined}
          name={actor.name}
          size="sm"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0 text-sm">
        <p className="truncate">
          <span className="font-medium">{actor?.name ?? t("someone")}</span>{" "}
          <span className="text-muted-foreground">{label}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
      </div>
      {!notification.readAt && !isFollowRequest && (
        <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
      )}
    </>
  );

  if (isFollowRequest && notification.followRequestId) {
    return (
      <div className="flex items-start gap-3 p-3 bg-primary/5">
        {content}
        <div className="flex flex-col gap-1 flex-shrink-0">
          {decided === "accepted" ? (
            <span className="text-xs text-muted-foreground px-2">
              {t("accepted")}
            </span>
          ) : decided === "rejected" ? (
            <span className="text-xs text-muted-foreground px-2">
              {t("rejected")}
            </span>
          ) : (
            <>
              <Button
                size="sm"
                onClick={() => accept.mutate(notification.followRequestId!)}
                disabled={accept.isPending || reject.isPending}
                className="cursor-pointer h-7 px-3 text-xs"
              >
                {t("accept")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => reject.mutate(notification.followRequestId!)}
                disabled={accept.isPending || reject.isPending}
                className="cursor-pointer h-7 px-3 text-xs"
              >
                {t("reject")}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
        notification.readAt ? "" : "bg-primary/5"
      }`}
    >
      {content}
    </Link>
  );
}
