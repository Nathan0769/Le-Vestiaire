"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "@/components/notifications/notification-item";

export function NotificationsClient() {
  const t = useTranslations("Notifications");
  const [tab, setTab] = useState<"all" | "unread">("all");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const notifs = useNotifications({ unreadOnly: tab === "unread" });

  const allItems = notifs.data?.pages.flatMap((p) => p.items) ?? [];

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !notifs.hasNextPage) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !notifs.isFetchingNextPage) {
        notifs.fetchNextPage();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [notifs]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          variant={tab === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("all")}
          className="cursor-pointer"
        >
          {t("tabAll")}
        </Button>
        <Button
          variant={tab === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("unread")}
          className="cursor-pointer"
        >
          {t("tabUnread")}
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => notifs.markRead({ all: true })}
          className="cursor-pointer"
        >
          {t("markAllRead")}
        </Button>
      </div>

      {notifs.isLoading && (
        <p className="text-sm text-muted-foreground py-4">{t("loading")}</p>
      )}
      {!notifs.isLoading && allItems.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {t("empty")}.
        </p>
      )}

      <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
        {allItems.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            onClick={() => {
              if (!n.readAt) notifs.markRead({ ids: [n.id] });
            }}
          />
        ))}
      </div>

      {notifs.hasNextPage && (
        <div ref={sentinelRef} className="py-4 text-center">
          {notifs.isFetchingNextPage && (
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          )}
        </div>
      )}
    </div>
  );
}
