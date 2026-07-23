"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFollowers } from "@/hooks/useFollowers";
import { useFollowing } from "@/hooks/useFollowing";
import { useFollowRequests } from "@/hooks/useFollowRequests";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { NetworkUserCard } from "@/components/follow/network-user-card";
import { FollowRequestCard } from "@/components/follow/follow-request-card";
import { SearchUsers } from "@/components/follow/search-users";
import { UsersRound } from "lucide-react";

export function NetworkClient() {
  const t = useTranslations("Follow");
  const user = useCurrentUser();
  const [tab, setTab] = useState("following");

  const following = useFollowing({
    username: user?.username ?? "",
    enabled: !!user?.username,
  });
  const followers = useFollowers({
    username: user?.username ?? "",
    enabled: !!user?.username,
  });
  const requests = useFollowRequests();

  const requestsCount = requests.data?.items.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <UsersRound className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">{t("networkTitle")}</h1>
      </div>

      <SearchUsers />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="following" className="cursor-pointer">
            {t("networkTabFollowing", { count: following.data?.items.length ?? 0 })}
          </TabsTrigger>
          <TabsTrigger value="followers" className="cursor-pointer">
            {t("networkTabFollowers", { count: followers.data?.items.length ?? 0 })}
          </TabsTrigger>
          <TabsTrigger value="requests" className="cursor-pointer">
            {t("networkTabRequests")}
            {requestsCount > 0 && (
              <span className="ml-1 px-2 rounded-full bg-primary text-primary-foreground text-xs">
                {requestsCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="following" className="space-y-2 mt-4">
          {following.isLoading && (
            <p className="text-sm text-muted-foreground">{t("networkLoading")}</p>
          )}
          {!following.isLoading &&
            (following.data?.items.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">
                {t("networkEmptyFollowing")}
              </p>
            )}
          {following.data?.items.map((u) => (
            <NetworkUserCard key={u.id} user={u} initialFollowState="following" />
          ))}
        </TabsContent>

        <TabsContent value="followers" className="space-y-2 mt-4">
          {followers.isLoading && (
            <p className="text-sm text-muted-foreground">{t("networkLoading")}</p>
          )}
          {!followers.isLoading &&
            (followers.data?.items.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">
                {t("networkEmptyFollowers")}
              </p>
            )}
          {followers.data?.items.map((u) => (
            <NetworkUserCard key={u.id} user={u} />
          ))}
        </TabsContent>

        <TabsContent value="requests" className="space-y-2 mt-4">
          {requests.isLoading && (
            <p className="text-sm text-muted-foreground">{t("networkLoading")}</p>
          )}
          {!requests.isLoading && requestsCount === 0 && (
            <p className="text-sm text-muted-foreground">
              {t("networkEmptyRequests")}
            </p>
          )}
          {requests.data?.items.map((req) => (
            <FollowRequestCard
              key={req.id}
              request={req}
              onAccept={(id) => requests.accept(id)}
              onReject={(id) => requests.reject(id)}
              disabled={requests.acceptPending || requests.rejectPending}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
