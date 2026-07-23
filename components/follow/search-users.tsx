"use client";

import { useTranslations } from "next-intl";
import { useSearchUsers } from "@/hooks/useSearchUsers";
import { useFollow } from "@/hooks/useFollow";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Clock, UserCheck } from "lucide-react";
import Link from "next/link";

export function SearchUsers() {
  const t = useTranslations("Follow");
  const {
    query,
    setQuery,
    results,
    loading,
    error,
    updateFollowState,
  } = useSearchUsers();
  const { follow, loading: followLoading } = useFollow();

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && (
        <p className="text-sm text-muted-foreground">{t("searchLoading")}</p>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("searchEmpty")}</p>
      )}

      <div className="space-y-2">
        {results.map((user) => {
          const state = user.followState;
          return (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 border border-border rounded-lg"
            >
              <Link
                href={`/u/${user.username}`}
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              >
                <UserAvatar
                  src={user.avatarUrl || undefined}
                  name={user.name}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{user.username}
                  </p>
                </div>
              </Link>
              {state === "none" && (
                <Button
                  size="sm"
                  disabled={followLoading}
                  onClick={async () => {
                    const res = await follow(user.id, "search");
                    if (res.success) updateFollowState(user.id, res.status);
                  }}
                  className="gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  {t("follow")}
                </Button>
              )}
              {state === "requested" && (
                <Button size="sm" variant="outline" disabled className="gap-2">
                  <Clock className="w-4 h-4" />
                  {t("requested")}
                </Button>
              )}
              {state === "following" && (
                <Button size="sm" variant="outline" disabled className="gap-2">
                  <UserCheck className="w-4 h-4" />
                  {t("following")}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
