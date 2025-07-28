"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
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

export function EditProfile() {
  const [avatarUrl, setAvatarUrl] = useState("/default-avatar.png");
  const [bio, setBio] = useState("");
  const [clubs, setClubs] = useState<SelectOption[]>([]);
  const [favoriteClub, setFavoriteClub] = useState<SelectOption | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChangeAvatar = (file: File) => {
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
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
      const res = await fetch("/api/user/favorite-club", { cache: "no-store" });
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
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBio();
    fetchFavoriteClub();
    fetchClubs();
  }, [fetchClubs]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="cursor-pointer">Modifier le profil</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <div className="flex items-center justify-between">
            <UserAvatar
              src={avatarUrl}
              name="X+X"
              size="lg"
              editable
              onChange={handleChangeAvatar}
            />
            <ModeToggle />
          </div>

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

        <SheetFooter>
          <Button
            type="button"
            className="cursor-pointer"
            disabled={loading}
            onClick={handleSave}
          >
            {loading ? "Sauvegarde…" : "Sauvegarder les changements"}
          </Button>
          <SheetClose asChild>
            <Button variant="outline" className="cursor-pointer">
              Fermer
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
