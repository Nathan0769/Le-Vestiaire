"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Clock } from "lucide-react";
import { useFriends } from "@/hooks/useFriends";
import { useFriendRequests } from "@/hooks/useFriendRequests";
import { useFriendship } from "@/hooks/useFriendship";
import { FriendCard } from "./friend-card";
import { FriendRequestCard } from "./friend-request-card";
import { SearchUsers } from "./search-users";
import { toast } from "sonner";

export function FriendsClient() {
  const {
    friends,
    loading: loadingFriends,
    refetch: refetchFriends,
  } = useFriends();
  const {
    requests,
    loading: loadingRequests,
    acceptRequest,
    rejectRequest,
    refetch: refetchRequests,
  } = useFriendRequests();
  const { blockUser, removeFriend } = useFriendship({
    onSuccess: () => {
      refetchFriends();
      refetchRequests();
    },
  });

  const handleAccept = async (requestId: string) => {
    const result = await acceptRequest(requestId);
    if (result.success) {
      refetchFriends();
    }
  };

  const handleReject = async (requestId: string) => {
    await rejectRequest(requestId);
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    const result = await removeFriend(friendshipId);
    if (!result.success) {
      toast.error(result.error || "Erreur");
    }
  };

  const handleBlockUser = async (userId: string) => {
    const result = await blockUser(userId);
    if (!result.success) {
      toast.error(result.error || "Erreur");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">Mes Amis</h1>
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends" className="gap-2">
            <Users className="w-4 h-4" />
            Amis
            {friends.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs">
                {friends.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <Clock className="w-4 h-4" />
            En attente
            {requests.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-red-500/20 text-red-600 rounded-full text-xs">
                {requests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Rechercher
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-6">
          {loadingFriends ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-muted rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Aucun ami pour le moment
              </h3>
              <p className="text-sm text-muted-foreground">
                Recherchez des utilisateurs pour commencer à construire votre
                réseau
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  onRemove={handleRemoveFriend}
                  onBlock={handleBlockUser}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          {loadingRequests ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 bg-muted rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Aucune demande en attente
              </h3>
              <p className="text-sm text-muted-foreground">
                Vos demandes d&apos;ami apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map((request) => (
                <FriendRequestCard
                  key={request.id}
                  request={request}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <SearchUsers />
        </TabsContent>
      </Tabs>
    </div>
  );
}
