"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { ModeToggle } from "../ui/toggle-dark-mode";
import { AutocompleteSelect, SelectOption } from "../ui/comboBox";
import { ProfileBio } from "@/components/profiles/profile-bio";
import { ThemeColorSelect } from "./themes-color";
import { UsernameInput } from "@/components/profiles/username-input";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFriendsCount } from "@/hooks/useFriendsCount";
import { Users } from "lucide-react";
import Link from "next/link";

export function EditProfile() {
  const currentUser = useCurrentUser();
  const { count: friendsCount, loading: loadingFriends } = useFriendsCount();
  const [isOpen, setIsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [username, setUsername] = useState("");
  const [initialUsername, setInitialUsername] = useState("");
  const [bio, setBio] = useState("");
  const [clubs, setClubs] = useState<SelectOption[]>([]);
  const [favoriteClub, setFavoriteClub] = useState<SelectOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState(false);

  useEffect(() => {
    if (currentUser?.avatarUrl) {
      setAvatarUrl(currentUser.avatarUrl);
    }
  }, [currentUser]);

  const handleChangeAvatar = async (file: File) => {
    try {
      if (!currentUser) throw new Error("Utilisateur non authentifié");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/user/avatar/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Erreur upload serveur");
      const { url, path } = await res.json();

      setAvatarUrl(url);

      await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: path }),
      });

      toast.success("Avatar mis à jour !");
    } catch (err) {
      console.error("Erreur upload avatar :", err);
      toast.error("Erreur lors de l'upload de l'avatar");
    }
  };

  const fetchUsername = async () => {
    try {
      const res = await fetch("/api/user/username", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.username === "string") {
          setUsername(data.username);
          setInitialUsername(data.username);
        }
      }
    } catch (err) {
      console.error("Erreur chargement username :", err);
    }
  };

  const fetchBio = async () => {
    try {
      const res = await fetch("/api/user/bio", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.bio === "string") setBio(data.bio);
    } catch (err) {
      console.error("Erreur chargement bio :", err);
    }
  };

  const fetchFavoriteClub = async () => {
    try {
      const res = await fetch("/api/user/favorite-club", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.id && data.name) {
        setFavoriteClub({ id: data.id, name: data.name });
      }
    } catch (err) {
      console.error("Erreur chargement club favori :", err);
    }
  };

  const fetchClubs = useCallback(async () => {
    try {
      const res = await fetch("/api/clubs", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setClubs(data);
    } catch (err) {
      console.error("Erreur chargement clubs :", err);
    }
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);

      if (username && isUsernameValid && username !== initialUsername) {
        const resUsername = await fetch("/api/user/username", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });

        if (!resUsername.ok) {
          const errorData = await resUsername.json();
          throw new Error(errorData.error || "Erreur username");
        }
        setInitialUsername(username);
      }

      const resBio = await fetch("/api/user/bio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });

      if (!resBio.ok) throw new Error("Erreur bio");

      if (favoriteClub) {
        const resClub = await fetch("/api/user/favorite-club", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favoriteClubId: favoriteClub.id }),
        });

        if (!resClub.ok) throw new Error("Erreur club");
      }

      toast.success("Profil mis à jour !");
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsername();
      fetchBio();
      fetchFavoriteClub();
      fetchClubs();
    }
  }, [isOpen, fetchClubs]);

  useEffect(() => {
    const handler = () => {
      fetchUsername();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("username-generated", handler as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "username-generated",
          handler as EventListener
        );
      }
    };
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="cursor-pointer" disabled={!currentUser}>
          Modifier votre profil
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-[100dvh] overflow-hidden">
        <SheetHeader className="flex-shrink-0 px-4 pt-6">
          <SheetTitle>Mon profil</SheetTitle>
          <SheetDescription>
            Modifiez votre profil ici. <br />
            Cliquez sur Sauvegarder lorsque vous avez terminé.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4">
          <div className="grid auto-rows-min gap-6 pb-4">
            <div className="flex items-center justify-between">
              <UserAvatar
                src={avatarUrl}
                name={currentUser?.name || "?"}
                size="lg"
                editable
                onChange={handleChangeAvatar}
              />
              <ModeToggle />
            </div>

            <div className="grid gap-2">
              <Link
                href="/friends"
                className="hover:text-primary transition-colors w-fit"
              >
                <label className="text-sm font-medium flex items-center gap-1.5 cursor-pointer">
                  <Users className="w-4 h-4" />
                  {loadingFriends
                    ? "..."
                    : `${friendsCount} ami${friendsCount !== 1 ? "s" : ""}`}
                </label>
              </Link>
            </div>

            <UsernameInput
              value={username}
              onChange={setUsername}
              onValidationChange={setIsUsernameValid}
            />

            <AutocompleteSelect
              options={clubs}
              value={favoriteClub}
              onChange={setFavoriteClub}
              placeholder="Choisir une équipe"
              label="Equipe favorite"
            />

            <ProfileBio value={bio} onChange={setBio} />
            <ThemeColorSelect />
          </div>
        </div>

        <div className="flex-shrink-0 border-t bg-background px-4 py-3 space-y-2">
          <Button
            type="button"
            className="w-full cursor-pointer"
            disabled={loading}
            onClick={handleSave}
          >
            {loading ? "Sauvegarde…" : "Sauvegarder les changements"}
          </Button>
          <SheetClose asChild>
            <Button variant="outline" className="w-full cursor-pointer">
              Fermer
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
