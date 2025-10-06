"use client";

import { UserAvatar } from "@/components/profiles/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Clock, Users, Ban, Heart } from "lucide-react";
import type { SearchUserResult } from "@/types/friendship";

interface UserSearchResultProps {
  user: SearchUserResult;
  onSendRequest: (userId: string) => void;
  onBlock: (userId: string) => void;
}

export function UserSearchResult({
  user,
  onSendRequest,
  onBlock,
}: UserSearchResultProps) {
  const getActionButton = () => {
    switch (user.friendshipStatus) {
      case null:
        return (
          <Button
            onClick={() => onSendRequest(user.id)}
            size="sm"
            className="cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        );

      case "PENDING":
        return (
          <Button disabled variant="outline" size="sm">
            <Clock className="w-4 h-4 mr-1" />
            En attente
          </Button>
        );

      case "ACCEPTED":
        return (
          <Button disabled variant="outline" size="sm">
            <Users className="w-4 h-4 mr-1" />
            Amis
          </Button>
        );

      case "REJECTED":
        return (
          <Button
            onClick={() => onSendRequest(user.id)}
            size="sm"
            className="cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Renvoyer
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <UserAvatar src={user.avatarUrl} name={user.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user.username}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground truncate pt-0.5">
                {user.favoriteClub?.name ? (
                  <>
                    <Heart className="w-3 h-3 text-red-500 flex-shrink-0" />
                    <span>{user.favoriteClub.name}</span>
                  </>
                ) : (
                  <span>Pas d&apos;équipe favorite</span>
                )}
              </div>
              {user.bio && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            {getActionButton()}
            {user.friendshipStatus !== "BLOCKED" && (
              <Button
                onClick={() => onBlock(user.id)}
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
              >
                <Ban className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
