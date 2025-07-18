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
import { useState } from "react";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { ModeToggle } from "../ui/toggle-dark-mode";
import { AutocompleteSelect, SelectOption } from "../ui/comboBox";
import { ProfileBio } from "@/components/profiles/profile-bio";
import { ThemeColorSelect } from "./themes-color";

export function EditProfile() {
  const [avatarUrl, setAvatarUrl] = useState("/default-avatar.png");
  const [bio, setBio] = useState("");

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
          <Button type="submit" className="cursor-pointer">
            Sauvegarder les changements
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
