"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { NotificationsPage } from "@/types/notifications";

interface UseNotificationsParams {
  limit?: number;
  unreadOnly?: boolean;
  enabled?: boolean;
}

export function useNotifications(params?: UseNotificationsParams) {
  const queryClient = useQueryClient();
  const limit = params?.limit ?? 20;
  const unreadOnly = params?.unreadOnly ?? false;

  const query = useInfiniteQuery({
    queryKey: ["notifications", { unreadOnly, limit }],
    enabled: params?.enabled ?? true,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: NotificationsPage) => last.nextCursor ?? undefined,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const search = new URLSearchParams();
      search.set("limit", String(limit));
      if (unreadOnly) search.set("unread", "1");
      if (pageParam) search.set("cursor", pageParam);
      const res = await fetch(`/api/notifications?${search.toString()}`);
      if (!res.ok) throw new Error("Erreur chargement notifs");
      return (await res.json()) as NotificationsPage;
    },
  });

  const markRead = useMutation({
    mutationFn: async (payload: { ids: string[] } | { all: true }) => {
      // Les FollowRequest sont des notifications virtuelles (id "follow-req:..."),
      // le mark-read ne s'applique pas — filtrer avant l'envoi.
      const filteredPayload =
        "ids" in payload
          ? { ids: payload.ids.filter((id) => !id.startsWith("follow-req:")) }
          : payload;
      if ("ids" in filteredPayload && filteredPayload.ids.length === 0) return;
      const res = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filteredPayload),
      });
      if (!res.ok) throw new Error("Erreur marquage lu");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });

  return {
    ...query,
    markRead: markRead.mutateAsync,
  };
}
