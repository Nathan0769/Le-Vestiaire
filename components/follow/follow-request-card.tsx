"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { Button } from "@/components/ui/button";
import type { FollowRequestItem } from "@/types/follow";

interface FollowRequestCardProps {
  request: FollowRequestItem;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  disabled?: boolean;
}

export function FollowRequestCard({
  request,
  onAccept,
  onReject,
  disabled,
}: FollowRequestCardProps) {
  const t = useTranslations("Follow");
  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
      <Link
        href={`/u/${request.requester.username}`}
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
      >
        <UserAvatar
          src={request.requester.avatarUrl || request.requester.image || undefined}
          name={request.requester.name}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{request.requester.name}</p>
          <p className="text-sm text-muted-foreground truncate">
            @{request.requester.username}
          </p>
        </div>
      </Link>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onAccept(request.id)}
          disabled={disabled}
          className="cursor-pointer"
        >
          {t("requestAccept")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onReject(request.id)}
          disabled={disabled}
          className="cursor-pointer"
        >
          {t("requestReject")}
        </Button>
      </div>
    </div>
  );
}
