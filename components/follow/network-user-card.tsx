"use client";

import Link from "next/link";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { FollowButton } from "@/components/follow/follow-button";
import type { PublicUser, FollowState } from "@/types/follow";

interface NetworkUserCardProps {
  user: PublicUser;
  initialFollowState?: FollowState;
  showFollowButton?: boolean;
}

export function NetworkUserCard({
  user,
  initialFollowState = "none",
  showFollowButton = true,
}: NetworkUserCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/40 transition-colors">
      <Link
        href={`/u/${user.username}`}
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
      >
        <UserAvatar
          src={user.avatarUrl || user.image || undefined}
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
      {showFollowButton && (
        <FollowButton
          targetUserId={user.id}
          initialState={initialFollowState}
          source="network"
        />
      )}
    </div>
  );
}
