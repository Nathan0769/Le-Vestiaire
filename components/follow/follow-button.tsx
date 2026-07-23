"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Clock } from "lucide-react";
import { useFollow } from "@/hooks/useFollow";
import { useTranslations } from "next-intl";
import type { FollowState } from "@/types/follow";

interface FollowButtonProps {
  targetUserId: string;
  initialState?: FollowState;
  isAnonymous?: boolean;
  source?: "feed" | "profile" | "search" | "network";
  size?: "sm" | "default" | "lg";
  onStateChange?: (state: FollowState) => void;
}

export function FollowButton({
  targetUserId,
  initialState = "none",
  isAnonymous,
  source = "profile",
  size = "sm",
  onStateChange,
}: FollowButtonProps) {
  const t = useTranslations("Follow");
  const [state, setState] = useState<FollowState>(initialState);
  const [hoverUnfollow, setHoverUnfollow] = useState(false);
  const { loading, follow, unfollow } = useFollow();

  if (isAnonymous) return null;

  if (state === "none") {
    return (
      <Button
        size={size}
        onClick={async () => {
          const res = await follow(targetUserId, source);
          if (res.success) {
            setState(res.status);
            onStateChange?.(res.status);
          }
        }}
        disabled={loading}
        className="gap-2 cursor-pointer"
      >
        <UserPlus className="w-4 h-4" />
        {t("follow")}
      </Button>
    );
  }

  if (state === "requested") {
    return (
      <Button
        size={size}
        variant="outline"
        onClick={async () => {
          const res = await unfollow(targetUserId);
          if (res.success) {
            setState("none");
            onStateChange?.("none");
          }
        }}
        disabled={loading}
        className="gap-2 cursor-pointer"
      >
        <Clock className="w-4 h-4" />
        {t("requested")}
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant="outline"
      onMouseEnter={() => setHoverUnfollow(true)}
      onMouseLeave={() => setHoverUnfollow(false)}
      onClick={async () => {
        const res = await unfollow(targetUserId);
        if (res.success) {
          setState("none");
          onStateChange?.("none");
        }
      }}
      disabled={loading}
      className="gap-2 cursor-pointer"
    >
      <UserCheck className="w-4 h-4" />
      {hoverUnfollow ? t("unfollow") : t("following")}
    </Button>
  );
}
