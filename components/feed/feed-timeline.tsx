"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { UsersRound, Globe, ChevronUp, ChevronDown } from "lucide-react";
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

interface AroundResponse {
  newer: FeedPostItem[];
  target: FeedPostItem | null;
  older: FeedPostItem[];
  hasMoreNewer: boolean;
  hasMoreOlder: boolean;
  newerCursor: string | null;
  olderCursor: string | null;
}

export function FeedTimeline({ initialData }: FeedTimelineProps) {
  const t = useTranslations("Feed");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const targetPostId = searchParams.get("post");
  const openComments = searchParams.get("comments") === "1";

  if (targetPostId) {
    return (
      <AroundView
        targetPostId={targetPostId}
        openComments={openComments}
        onExit={() => router.replace(pathname, { scroll: false })}
      />
    );
  }

  return <TimelineView initialData={initialData} />;
}

/* ------------------------------------------------------------------ */
/* Mode "around" : vue centrée sur un post depuis une notif           */
/* ------------------------------------------------------------------ */

interface AroundViewProps {
  targetPostId: string;
  openComments: boolean;
  onExit: () => void;
}

function AroundView({ targetPostId, openComments, onExit }: AroundViewProps) {
  const t = useTranslations("Feed");
  const targetRef = useRef<HTMLDivElement | null>(null);
  const [olderPages, setOlderPages] = useState<FeedPostItem[][]>([]);
  const [newerPages, setNewerPages] = useState<FeedPostItem[][]>([]);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [newerCursor, setNewerCursor] = useState<string | null>(null);
  const [hasMoreNewer, setHasMoreNewer] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const olderSentinelRef = useRef<HTMLDivElement | null>(null);

  const around = useQuery({
    queryKey: ["feed-around", targetPostId],
    queryFn: async () => {
      const res = await fetch(`/api/feed/around/${targetPostId}`);
      if (!res.ok) throw new Error("around fetch error");
      return (await res.json()) as AroundResponse;
    },
  });

  // Init des cursors + pages quand la 1ère fetch arrive.
  useEffect(() => {
    if (!around.data) return;
    setOlderPages(around.data.older.length > 0 ? [around.data.older] : []);
    setNewerPages(around.data.newer.length > 0 ? [around.data.newer] : []);
    setOlderCursor(around.data.olderCursor);
    setNewerCursor(around.data.newerCursor);
    setHasMoreOlder(around.data.hasMoreOlder);
    setHasMoreNewer(around.data.hasMoreNewer);
  }, [around.data]);

  // Scroll vers la card target dès qu'elle est dans le DOM.
  useEffect(() => {
    if (around.data?.target && targetRef.current) {
      // 2× requestAnimationFrame pour attendre le layout complet
      // (images en cours de load peuvent décaler la position).
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          targetRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        });
      });
    }
  }, [around.data?.target?.id]);

  // Infinite scroll bas pour les posts plus vieux
  useEffect(() => {
    const el = olderSentinelRef.current;
    if (!el || !hasMoreOlder) return;
    const observer = new IntersectionObserver(async (entries) => {
      if (!entries[0].isIntersecting || !olderCursor) return;
      const res = await fetch(
        `/api/feed?scope=global&cursor=${encodeURIComponent(olderCursor)}`
      );
      if (!res.ok) return;
      const page = (await res.json()) as FeedPage;
      setOlderPages((p) => [...p, page.items]);
      setOlderCursor(page.nextCursor);
      setHasMoreOlder(!!page.nextCursor);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMoreOlder, olderCursor]);

  const loadMoreNewer = async () => {
    if (!newerCursor) return;
    // Utilise around avec un before large pour récupérer les posts entre le
    // premier newer visible et maintenant.
    const res = await fetch(
      `/api/feed/around/${newerCursor}?before=20&after=0`
    );
    if (!res.ok) return;
    const data = (await res.json()) as AroundResponse;
    // Le "target" de cette 2e query = premier newer précédent, à skip pour éviter doublon
    const fresh = data.newer;
    if (fresh.length === 0) {
      setHasMoreNewer(false);
      return;
    }
    setNewerPages((p) => [fresh, ...p]);
    setNewerCursor(fresh[0]?.id ?? null);
    setHasMoreNewer(data.hasMoreNewer);
  };

  const allNewer = newerPages.flat();
  const allOlder = olderPages.flat();
  const target = around.data?.target;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={onExit}
          className="cursor-pointer"
        >
          {t("aroundExit")}
        </Button>
      </div>

      <div className="flex gap-6 justify-center">
        <div className="w-full max-w-lg">
          {around.isLoading && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("loading")}
            </p>
          )}

          {around.isError && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("aroundNotFound")}
            </p>
          )}

          {target && (
            <>
              {hasMoreNewer && (
                <div className="mb-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMoreNewer}
                    className="cursor-pointer gap-2"
                  >
                    <ChevronUp className="w-4 h-4" />
                    {t("aroundLoadMoreNewer")}
                  </Button>
                </div>
              )}

              <div className="space-y-6 mb-6">
                {allNewer.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              <div
                ref={targetRef}
                className="mb-6 ring-2 ring-primary rounded-xl transition-all"
              >
                <PostCard
                  key={target.id}
                  post={target}
                  defaultCommentsOpen={openComments}
                />
              </div>

              <div className="space-y-6">
                {allOlder.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              {hasMoreOlder && (
                <div
                  ref={olderSentinelRef}
                  className="py-4 text-center text-sm text-muted-foreground"
                >
                  <ChevronDown className="w-4 h-4 inline mr-1" />
                  {t("loading")}
                </div>
              )}
            </>
          )}
        </div>
        <RecommendedUsers />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mode "timeline" : feed classique avec onglets Mes abonnements/Global */
/* ------------------------------------------------------------------ */

interface TimelineViewProps {
  initialData: FeedPage;
}

function TimelineView({ initialData }: TimelineViewProps) {
  const t = useTranslations("Feed");
  const [scope, setScope] = useState<Scope>("global");
  const [sinceTimestamp, setSinceTimestamp] = useState(() =>
    new Date().toISOString()
  );
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const feed = useInfiniteQuery({
    queryKey: ["feed", scope],
    initialPageParam: undefined as string | undefined,
    initialData:
      scope === "global"
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
      <div className="mb-8">
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

          <div className="space-y-6">
            {allItems.map((post) => (
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
