"use client";

import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useSearchUsers } from "@/hooks/useSearchUsers";
import { UserSearchResult } from "./user-search-result";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function SearchUsers() {
  const t = useTranslations("Friends");
  const { query, setQuery, results, loading, sendFriendRequest, blockUser } =
    useSearchUsers();

  const handleSendRequest = async (userId: string) => {
    const res = await sendFriendRequest(userId);
    if (res.success) {
      toast.success(t("requestSent"));
    } else {
      toast.error(res.error || t("error"));
    }
  };

  const handleBlock = async (userId: string) => {
    if (!confirm(t("blockUserConfirm"))) return;

    const res = await blockUser(userId);
    if (res.success) {
      toast.success(t("userBlocked"));
    } else {
      toast.error(res.error || t("error"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {query.length > 0 && query.length < 2 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t("minCharacters")}
        </p>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("noUsersFound")}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {results.length} {results.length > 1 ? t("results") : t("result")}
          </p>
          {results.map((user) => (
            <UserSearchResult
              key={user.id}
              user={user}
              onSendRequest={handleSendRequest}
              onBlock={handleBlock}
            />
          ))}
        </div>
      )}
    </div>
  );
}
