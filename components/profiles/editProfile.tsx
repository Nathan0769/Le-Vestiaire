"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  const [loading, setLoading] = useState(false);

  const CLUBS = [
    { id: "USG", name: "Union Saint Gilloise" },
    { id: "OL", name: "Olympique Lyonnais" },
    { id: "RMA", name: "Real Madrid" },
  ];
  const [favoriteClub, setFavoriteClub] = useState<SelectOption | null>(null);

  const handleChangeAvatar = (file: File) => {
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
  };

  const fetchBio = async () => {
    try {
      const res = await fetch("/api/user/bio", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.bio === "string") {
        setBio(data.bio);
      }
    } catch (err) {
      console.error("Erreur lors du chargement de la bio :", err);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/bio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });

      if (!res.ok) throw new Error("Erreur lors de la sauvegarde.");
      toast.success("Bio mise à jour !");
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBio();
  }, []);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="cursor-pointer">
          Open
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <ModeToggle />

          <UserAvatar
            src={avatarUrl}
            name="X+X"
            size="lg"
            editable
            onChange={handleChangeAvatar}
          />

          <Label>Équipe favorite</Label>
          <AutocompleteSelect
            options={CLUBS}
            value={favoriteClub}
            onChange={setFavoriteClub}
            placeholder="Choisir une équipe"
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
