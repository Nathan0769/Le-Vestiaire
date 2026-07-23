"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { UsersRound, Globe, Rss } from "lucide-react";
import { useTranslations } from "next-intl";
import { PostCard } from "@/components/feed/post-card";
import { NewPostsBadge } from "@/components/feed/new-posts-badge";
import { RecommendedUsers } from "@/components/feed/recommended-users";
import { Button } from "@/components/ui/button";
import type { FeedPage, FeedPostItem } from "@/types/feed";
import { trackEvent } from "@/lib/analytics";

interface FeedTimelineProps {
  initialData: FeedPage;
}

type Scope = "friends" | "global";

export function FeedTimeline({ initialData }: FeedTimelineProps) {
  const t = useTranslations("Feed");
  const searchParams = useSearchParams();
  // Capté une seule fois au mount : le pin dispose s'il switch d'onglet.
  const [pinnedPostId, setPinnedPostId] = useState<string | null>(() =>
    searchParams.get("post")
  );
  const [openComments] = useState(
    () => searchParams.get("comments") === "1"
  );
  const [scope, setScopeState] = useState<Scope>("friends");
  const [sinceTimestamp, setSinceTimestamp] = useState(() =>
    new Date().toISOString()
  );
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pinnedRef = useRef<HTMLDivElement | null>(null);

  // Changer d'onglet retire le pin (signal user : "je veux voir autre chose").
  const setScope = (next: Scope) => {
    if (next !== scope) setPinnedPostId(null);
    setScopeState(next);
  };

  // Fetch le post pinné (venant d'une notif ?post=XXX) pour le remonter en tête.
  const pinnedPost = useQuery({
    queryKey: ["post", pinnedPostId],
    enabled: !!pinnedPostId,
    queryFn: async () => {
      const res = await fetch(`/api/posts/${pinnedPostId}`);
      if (!res.ok) return { post: null };
      return (await res.json()) as { post: FeedPostItem | null };
    },
  });

  // Scroll vers la card pinnée dès qu'elle est chargée.
  useEffect(() => {
    if (pinnedPost.data?.post && pinnedRef.current) {
      pinnedRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [pinnedPost.data?.post]);

  const feed = useInfiniteQuery({
    queryKey: ["feed", scope],
    initialPageParam: undefined as string | undefined,
    initialData:
      scope === "friends"
        ? { pages: [initialData], pageParams: [undefined] }
        : undefined,
    getNextPageParam: (last: FeedPage) => last.nextCursor ?? undefined,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const params = new URLSearchParams();
      params.set("scope", scope);
      if (pageParam) params.set("cursor", pageParam);
      const res = await fetch(`/api/feed?${params.toString()}`);
      if (!res.ok) throw new Error("Feed error");
      return (await res.json()) as FeedPage;
    },
  });

  const newCount = useQuery({
    queryKey: ["feed-new-count", scope, sinceTimestamp],
    enabled: scope === "friends",
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const res = await fetch(
        `/api/feed/new-count?since=${encodeURIComponent(sinceTimestamp)}`
      );
      if (!res.ok) return { count: 0 };
      return (await res.json()) as { count: number };
    },
  });

  useEffect(() => {
    trackEvent({ name: "feed_viewed", params: {} });
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !feed.hasNextPage) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !feed.isFetchingNextPage) {
        feed.fetchNextPage();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [feed]);

  const allItems = feed.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Rss className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
      </div>

      <div className="flex gap-6 justify-center">
      <div className="w-full max-w-lg">
      <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-muted mb-6">
        <Button
          variant={scope === "friends" ? "default" : "ghost"}
          size="sm"
          onClick={() => setScope("friends")}
          className="cursor-pointer rounded-full gap-2"
        >
          <UsersRound className="w-4 h-4" />
          {t("tabs.friends")}
        </Button>
        <Button
          variant={scope === "global" ? "default" : "ghost"}
          size="sm"
          onClick={() => setScope("global")}
          className="cursor-pointer rounded-full gap-2"
        >
          <Globe className="w-4 h-4" />
          {t("tabs.global")}
        </Button>
      </div>

      {scope === "friends" && (
        <NewPostsBadge
          count={newCount.data?.count ?? 0}
          onClick={() => {
            trackEvent({ name: "feed_refreshed", params: {} });
            setSinceTimestamp(new Date().toISOString());
            feed.refetch();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {feed.isLoading && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {t("loading")}
        </p>
      )}

      {!feed.isLoading && allItems.length === 0 && (
        <EmptyState scope={scope} />
      )}

      {pinnedPost.data?.post && (
        <div ref={pinnedRef} className="mb-6">
          <PostCard
            post={pinnedPost.data.post}
            defaultCommentsOpen={openComments}
          />
        </div>
      )}

      <div className="space-y-6">
        {allItems
          .filter((post) => post.id !== pinnedPostId)
          .map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
      </div>

      {feed.hasNextPage && (
        <div ref={sentinelRef} className="py-4 text-center">
          {feed.isFetchingNextPage && (
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          )}
        </div>
      )}
      </div>
      <RecommendedUsers />
      </div>
    </div>
  );
}

function EmptyState({ scope }: { scope: Scope }) {
  const t = useTranslations("Feed.empty");
  if (scope === "friends") {
    return (
      <div className="text-center py-16 space-y-4 border border-dashed border-border rounded-xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <UsersRound className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold">{t("friendsTitle")}</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {t("friendsDescription")}
          </p>
        </div>
        <Link
          href="/network"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:opacity-90"
        >
          <UsersRound className="w-4 h-4" />
          {t("friendsCta")}
        </Link>
      </div>
    );
  }
  return (
    <div className="text-center py-16 space-y-2 border border-dashed border-border rounded-xl">
      <Globe className="w-12 h-12 mx-auto text-muted-foreground" />
      <p className="text-lg font-semibold">{t("globalTitle")}</p>
      <p className="text-sm text-muted-foreground">{t("globalDescription")}</p>
    </div>
  );
}
