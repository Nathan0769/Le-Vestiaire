"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { useFollow } from "@/hooks/useFollow";

interface RecommendedUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  jerseyCount: number;
  favoriteClubName: string | null;
}

export function RecommendedUsers() {
  const t = useTranslations("Feed");
  const [states, setStates] = useState<
    Record<string, "none" | "following" | "requested">
  >({});
  const { follow, loading } = useFollow();

  const query = useQuery({
    queryKey: ["recommended-users"],
    queryFn: async () => {
      const res = await fetch("/api/users/recommended");
      if (!res.ok) return { items: [] as RecommendedUser[] };
      return (await res.json()) as { items: RecommendedUser[] };
    },
  });

  const items = query.data?.items ?? [];
  if (!query.isLoading && items.length === 0) return null;

  return (
    <aside className="hidden lg:block w-72 flex-shrink-0">
      <div className="sticky top-4 space-y-3">
        <h2 className="text-sm font-bold text-muted-foreground px-1">
          {t("recommendedTitle")}
        </h2>

        {query.isLoading && (
          <p className="text-xs text-muted-foreground px-1">{t("loading")}</p>
        )}

        <div className="space-y-3">
          {items.map((u) => {
            const state = states[u.id] ?? "none";
            return (
              <div
                key={u.id}
                className="flex items-center gap-3 min-w-0 px-1"
              >
                <Link
                  href={`/u/${u.username}`}
                  className="flex-shrink-0 cursor-pointer"
                >
                  <UserAvatar
                    src={u.avatarUrl ?? undefined}
                    name={u.username}
                    size="sm"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/u/${u.username}`}
                    className="block text-sm font-semibold truncate cursor-pointer hover:opacity-70"
                  >
                    {u.username}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">
                    {u.jerseyCount}{" "}
                    {u.jerseyCount === 1
                      ? t("recommendedJerseySingle")
                      : t("recommendedJerseyMany")}
                    {u.favoriteClubName && ` · ${u.favoriteClubName}`}
                  </p>
                </div>
                {state === "none" && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={async () => {
                      const res = await follow(u.id, "feed");
                      if (res.success) {
                        setStates((s) => ({ ...s, [u.id]: res.status }));
                      }
                    }}
                    className="text-xs font-semibold text-primary hover:opacity-70 cursor-pointer disabled:opacity-40"
                  >
                    {t("recommendedFollow")}
                  </button>
                )}
                {state === "requested" && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    {t("recommendedRequested")}
                  </span>
                )}
                {state === "following" && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    {t("recommendedFollowing")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
