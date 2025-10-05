"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { Search, UserPlus, Clock, Users, Ban } from "lucide-react";
import { useSearchUsers } from "@/hooks/useSearchUsers";
import { toast } from "sonner";

export function SearchUsers() {
  const [searchValue, setSearchValue] = useState("");
  const { result, loading, searchUser, sendFriendRequest, blockUser } =
    useSearchUsers();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      searchUser(searchValue);
    }
  };

  const handleSendRequest = async () => {
    if (!result) return;

    const res = await sendFriendRequest(result.id);
    if (res.success) {
      toast.success("Demande envoyée");
    } else {
      toast.error(res.error || "Erreur");
    }
  };

  const handleBlock = async () => {
    if (!result) return;
    if (!confirm(`Bloquer ${result.username} ?`)) return;

    const res = await blockUser(result.id);
    if (res.success) {
      toast.success("Utilisateur bloqué");
    } else {
      toast.error(res.error || "Erreur");
    }
  };

  const getActionButton = () => {
    if (!result) return null;

    switch (result.friendshipStatus) {
      case null:
        return (
          <Button onClick={handleSendRequest} className="cursor-pointer">
            <UserPlus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        );

      case "PENDING":
        return (
          <Button disabled variant="outline">
            <Clock className="w-4 h-4 mr-2" />
            En attente
          </Button>
        );

      case "ACCEPTED":
        return (
          <Button disabled variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Déjà amis
          </Button>
        );

      case "REJECTED":
        return (
          <Button onClick={handleSendRequest} className="cursor-pointer">
            <UserPlus className="w-4 h-4 mr-2" />
            Renvoyer une demande
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Rechercher par pseudo exact..."
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={loading} className="cursor-pointer">
          {loading ? "Recherche..." : "Rechercher"}
        </Button>
      </form>

      {result && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={result.avatarUrl}
                  name={result.name}
                  size="md"
                />
                <div>
                  <p className="font-semibold">{result.username}</p>
                  <p className="text-sm text-muted-foreground">{result.name}</p>
                  {result.bio && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {result.bio}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {getActionButton()}
                {result.friendshipStatus !== "BLOCKED" && (
                  <Button
                    onClick={handleBlock}
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer"
                  >
                    <Ban className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && searchValue && !result && (
        <div className="text-center py-8 text-muted-foreground">
          Aucun utilisateur trouvé avec ce pseudo
        </div>
      )}
    </div>
  );
}
