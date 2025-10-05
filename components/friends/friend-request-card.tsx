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
import { Check, X } from "lucide-react";
import type { FriendshipRequest } from "@/types/friendship";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

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
  const handleAccept = async () => {
    try {
      await onAccept(request.id);
      toast.success(`Vous êtes maintenant ami avec ${request.sender.username}`);
    } catch {
      toast.error("Erreur lors de l'acceptation");
    }
  };

  const handleReject = async () => {
    try {
      await onReject(request.id);
      toast.success("Demande refusée");
    } catch {
      toast.error("Erreur lors du refus");
    }
  };

  const timeAgo = formatDistanceToNow(new Date(request.createdAt), {
    addSuffix: true,
    locale: fr,
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
              {request.sender.username}
            </CardTitle>
            <CardDescription className="text-sm">
              {request.sender.name}
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
            Accepter
          </Button>
          <Button
            onClick={handleReject}
            variant="outline"
            className="flex-1 cursor-pointer"
            size="sm"
          >
            <X className="w-4 h-4 mr-1" />
            Refuser
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
