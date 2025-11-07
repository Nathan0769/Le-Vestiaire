"use client";

import { UserAvatar } from "@/components/profiles/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, X, Heart } from "lucide-react";
import type { FriendshipRequest } from "@/types/friendship";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS, es } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

interface FriendRequestCardProps {
  request: FriendshipRequest;
  onAccept: (requestId: string) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
}

export function FriendRequestCard({
  request,
  onAccept,
  onReject,
}: FriendRequestCardProps) {
  const t = useTranslations("Friends");
  const locale = useLocale();

  const handleAccept = async () => {
    try {
      await onAccept(request.id);
      const displayName = request.sender.username ?? t("thisUser");
      toast.success(t("nowFriendsWith", { name: displayName }));
    } catch {
      toast.error(t("errorAccepting"));
    }
  };

  const handleReject = async () => {
    try {
      await onReject(request.id);
      toast.success(t("requestRejected"));
    } catch {
      toast.error(t("errorRejecting"));
    }
  };

  const getDateLocale = () => {
    switch (locale) {
      case "fr": return fr;
      case "en": return enUS;
      case "es": return es;
      default: return fr;
    }
  };

  const timeAgo = formatDistanceToNow(new Date(request.createdAt), {
    addSuffix: true,
    locale: getDateLocale(),
  });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-3">
          <UserAvatar
            src={request.sender.avatarUrl}
            name={request.sender.name}
            size="md"
          />
          <div className="flex-1">
            <CardTitle className="text-base">
              {request.sender.username ?? t("user")}
            </CardTitle>

            <CardDescription className="text-sm flex items-center gap-1 pt-0.5">
              {request.sender.favoriteClub?.name ? (
                <>
                  <Heart className="w-3 h-3 text-red-500" />
                  <span>{request.sender.favoriteClub.name}</span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  {t("noFavoriteTeam")}
                </span>
              )}
            </CardDescription>
          </div>
        </div>

        {request.sender.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {request.sender.bio}
          </p>
        )}

        <p className="text-xs text-muted-foreground mt-2">{timeAgo}</p>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button
            onClick={handleAccept}
            className="flex-1 cursor-pointer"
            size="sm"
          >
            <Check className="w-4 h-4 mr-1" />
            {t("accept")}
          </Button>
          <Button
            onClick={handleReject}
            variant="outline"
            className="flex-1 cursor-pointer"
            size="sm"
          >
            <X className="w-4 h-4 mr-1" />
            {t("reject")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
