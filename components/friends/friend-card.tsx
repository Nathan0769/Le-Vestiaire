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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, UserMinus, Ban, Heart } from "lucide-react";
import type { FriendWithUser } from "@/types/friendship";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface FriendCardProps {
  friend: FriendWithUser;
  onRemove: (friendshipId: string) => Promise<void>;
  onBlock: (userId: string) => Promise<void>;
}

export function FriendCard({ friend, onRemove, onBlock }: FriendCardProps) {
  const t = useTranslations("Friends");

  const handleRemove = async () => {
    const displayName = friend.user.username ?? t("thisUser");
    if (!confirm(t("removeFriendConfirm", { name: displayName }))) return;

    try {
      await onRemove(friend.id);
      toast.success(t("friendRemoved"));
    } catch {
      toast.error(t("errorRemoving"));
    }
  };

  const handleBlock = async () => {
    const displayName = friend.user.username ?? t("thisUser");
    if (!confirm(t("blockConfirm", { name: displayName }))) return;

    try {
      await onBlock(friend.user.id);
      toast.success(t("userBlocked"));
    } catch {
      toast.error(t("errorBlocking"));
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={friend.user.avatarUrl}
              name={friend.user.name}
              size="md"
            />
            <div>
              <CardTitle className="text-base">
                {friend.user.username ?? t("user")}
              </CardTitle>
              <CardDescription className="text-sm flex items-center gap-1 pt-0.5">
                {friend.user.favoriteClub ? (
                  <>
                    <Heart className="w-3 h-3 text-red-500" />
                    <span>{friend.user.favoriteClub.name}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    {t("noFavoriteTeam")}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleRemove}
                className="text-red-600 cursor-pointer"
              >
                <UserMinus className="w-4 h-4 mr-2" />
                {t("removeFriend")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleBlock}
                className="text-red-600 cursor-pointer"
              >
                <Ban className="w-4 h-4 mr-2" />
                {t("block")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {friend.user.bio && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {friend.user.bio}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
