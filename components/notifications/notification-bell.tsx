"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUnreadNotificationsCount } from "@/hooks/useUnreadNotificationsCount";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Link } from "@/i18n/routing";

export function NotificationBell() {
  const t = useTranslations("Notifications");
  const [open, setOpen] = useState(false);
  const { data } = useUnreadNotificationsCount();
  const count = data?.count ?? 0;

  const notifs = useNotifications({ limit: 10, enabled: open });

  const items = notifs.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative cursor-pointer"
          aria-label={t("title")}
        >
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">{t("title")}</h3>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer text-xs h-7"
              onClick={() => notifs.markRead({ all: true })}
            >
              {t("markAllRead")}
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifs.isLoading && (
            <p className="text-sm text-muted-foreground p-4 text-center">
              {t("loading")}
            </p>
          )}
          {!notifs.isLoading && items.length === 0 && (
            <p className="text-sm text-muted-foreground p-4 text-center">
              {t("empty")}
            </p>
          )}
          <div className="divide-y divide-border">
            {items.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={() => {
                  if (!n.readAt) notifs.markRead({ ids: [n.id] });
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </div>
        <div className="p-2 border-t border-border">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-sm text-primary hover:underline py-1"
          >
            {t("seeAll")}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
