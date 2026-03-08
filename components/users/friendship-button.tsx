"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Clock, Check } from "lucide-react";
import { useFriendship } from "@/hooks/useFriendship";
import type { FriendshipStatus } from "@/types/friendship";
import { useTranslations } from "next-intl";

interface FriendshipButtonProps {
  targetUserId: string;
  friendshipId?: string;
  status?: FriendshipStatus | null;
  isSender?: boolean;
  isAnonymous: boolean;
}

export function FriendshipButton({
  targetUserId,
  friendshipId,
  status: initialStatus,
  isSender,
  isAnonymous,
}: FriendshipButtonProps) {
  const t = useTranslations("Friends");
  const [status, setStatus] = useState(initialStatus);
  const [currentFriendshipId, setCurrentFriendshipId] = useState(friendshipId);

  const { loading, sendRequest, acceptRequest, rejectRequest } = useFriendship();

  if (isAnonymous || status === "BLOCKED") return null;

  if (!status) {
    return (
      <Button
        size="sm"
        onClick={async () => {
          const res = await sendRequest(targetUserId);
          if (res.success) setStatus("PENDING");
        }}
        disabled={loading}
        className="gap-2 cursor-pointer"
      >
        <UserPlus className="w-4 h-4" />
        {t("addFriend")}
      </Button>
    );
  }

  if (status === "PENDING" && isSender) {
    return (
      <Button size="sm" variant="outline" disabled className="gap-2">
        <Clock className="w-4 h-4" />
        {t("requestSent")}
      </Button>
    );
  }

  if (status === "PENDING" && !isSender && currentFriendshipId) {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={async () => {
            const res = await acceptRequest(currentFriendshipId);
            if (res.success) setStatus("ACCEPTED");
          }}
          disabled={loading}
          className="cursor-pointer"
        >
          {t("accept")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            const res = await rejectRequest(currentFriendshipId);
            if (res.success) setStatus("REJECTED");
          }}
          disabled={loading}
          className="cursor-pointer"
        >
          {t("reject")}
        </Button>
      </div>
    );
  }

  if (status === "ACCEPTED") {
    return (
      <Button size="sm" variant="outline" disabled className="gap-2">
        <Check className="w-4 h-4" />
        {t("friends")}
      </Button>
    );
  }

  if (status === "REJECTED") {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          const res = await sendRequest(targetUserId);
          if (res.success) {
            setStatus("PENDING");
            setCurrentFriendshipId(undefined);
          }
        }}
        disabled={loading}
        className="gap-2 cursor-pointer"
      >
        <UserPlus className="w-4 h-4" />
        {t("resend")}
      </Button>
    );
  }

  return null;
}
