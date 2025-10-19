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

interface FriendCardProps {
  friend: FriendWithUser;
  onRemove: (friendshipId: string) => Promise<void>;
  onBlock: (userId: string) => Promise<void>;
}

export function FriendCard({ friend, onRemove, onBlock }: FriendCardProps) {
  const handleRemove = async () => {
    const displayName = friend.user.username ?? "cet utilisateur";
    if (!confirm(`Retirer ${displayName} de vos amis ?`)) return;

    try {
      await onRemove(friend.id);
      toast.success("Ami retiré");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleBlock = async () => {
    const displayName = friend.user.username ?? "cet utilisateur";
    if (!confirm(`Bloquer ${displayName} ?`)) return;

    try {
      await onBlock(friend.user.id);
      toast.success("Utilisateur bloqué");
    } catch {
      toast.error("Erreur lors du blocage");
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
                {friend.user.username ?? "Utilisateur"}
              </CardTitle>
              <CardDescription className="text-sm flex items-center gap-1 pt-0.5">
                {friend.user.favoriteClub ? (
                  <>
                    <Heart className="w-3 h-3 text-red-500" />
                    <span>{friend.user.favoriteClub.name}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    Pas d&apos;équipe favorite
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
                Retirer des amis
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleBlock}
                className="text-red-600 cursor-pointer"
              >
                <Ban className="w-4 h-4 mr-2" />
                Bloquer
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
