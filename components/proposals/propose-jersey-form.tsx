"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { Camera, X } from "lucide-react";
import Image from "next/image";
import { JerseyType } from "@prisma/client";
import { CreateProposalData } from "@/types/proposal";

const JERSEY_TYPE_LABELS: Record<JerseyType, string> = {
  HOME: "Domicile",
  AWAY: "Extérieur",
  THIRD: "Third",
  FOURTH: "Fourth",
  GOALKEEPER: "Gardien",
  SPECIAL: "Spécial",
};

interface Club {
  id: string;
  name: string;
  shortName: string;
}

interface ProposeJerseyFormProps {
  onSuccess?: () => void;
}

export function ProposeJerseyForm({ onSuccess }: ProposeJerseyFormProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [clubSearchQuery, setClubSearchQuery] = useState("");
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isClubSelectOpen, setIsClubSelectOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<CreateProposalData>>({
    name: "",
    clubId: "",
    season: "",
    type: undefined,
    brand: "",
    imageUrl: "",
    description: "",
  });

  const [specialName, setSpecialName] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadClubs = async () => {
      try {
        const response = await fetch("/api/clubs");
        if (!response.ok) throw new Error("Erreur chargement clubs");
        const data = await response.json();
        setClubs(data);
        setFilteredClubs(data);
      } catch (error) {
        console.error("Erreur chargement clubs:", error);
        toast.error("Impossible de charger la liste des clubs");
      } finally {
        setIsLoadingClubs(false);
      }
    };

    loadClubs();
  }, []);

  useEffect(() => {
    if (!clubSearchQuery.trim()) {
      setFilteredClubs(clubs);
      return;
    }

    const query = clubSearchQuery.toLowerCase();
    const filtered = clubs.filter(
      (club) =>
        club.name.toLowerCase().includes(query) ||
        club.id.toLowerCase().includes(query)
    );
    setFilteredClubs(filtered);
  }, [clubSearchQuery, clubs]);

  useEffect(() => {
    if (!formData.clubId || !formData.season || !formData.type) {
      return;
    }

    const selectedClub = clubs.find((club) => club.id === formData.clubId);
    if (!selectedClub) return;

    const typeLabel =
      formData.type === "SPECIAL"
        ? specialName.trim() || "Spécial"
        : JERSEY_TYPE_LABELS[formData.type];

    const generatedName = `Maillot ${typeLabel} ${selectedClub.shortName} ${formData.season}`;

    setFormData((prev) => ({ ...prev, name: generatedName }));
  }, [formData.clubId, formData.season, formData.type, specialName, clubs]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La photo ne doit pas dépasser 2MB");
      return;
    }

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData({ ...formData, imageUrl: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.clubId ||
      !formData.season ||
      !formData.type ||
      !formData.brand
    ) {
      toast.error("Tous les champs sont obligatoires sauf la description");
      return;
    }

    if (!photoFile) {
      toast.error("Une photo est obligatoire");
      return;
    }

    let imageUrl = "";
    setIsUploadingPhoto(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", photoFile);

      const uploadResponse = await fetch("/api/jersey-proposals/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Erreur lors de l'upload");
      }

      const { url } = await uploadResponse.json();
      imageUrl = url;
    } catch (error) {
      console.error("Erreur upload photo:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'upload de la photo"
      );
      setIsUploadingPhoto(false);
      return;
    } finally {
      setIsUploadingPhoto(false);
    }

    setIsSubmitting(true);
    try {
      const proposalData: CreateProposalData = {
        name: formData.name!,
        clubId: formData.clubId!,
        season: formData.season!,
        type: formData.type!,
        brand: formData.brand!,
        imageUrl,
        description: formData.description || undefined,
      };

      const response = await fetch("/api/jersey-proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(proposalData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      toast.success("Proposition soumise avec succès !");

      setFormData({
        name: "",
        clubId: "",
        season: "",
        type: undefined,
        brand: "",
        imageUrl: "",
        description: "",
      });
      setSpecialName("");
      setPhotoFile(null);
      setPhotoPreview(null);

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Erreur création proposition:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la création de la proposition"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-1">
          Nom du maillot{" "}
          <span className="text-muted-foreground text-xs font-normal">
            (Généré automatiquement)
          </span>
        </Label>
        <Input
          id="name"
          placeholder="Sera généré automatiquement..."
          value={formData.name}
          disabled
          className="bg-muted"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="club" className="flex items-center gap-1">
            Club <span className="text-destructive">*</span>
          </Label>
          <Popover open={isClubSelectOpen} onOpenChange={setIsClubSelectOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isClubSelectOpen}
                className="w-full justify-between"
                disabled={isLoadingClubs}
              >
                {formData.clubId
                  ? clubs.find((club) => club.id === formData.clubId)?.name
                  : isLoadingClubs
                  ? "Chargement..."
                  : "Rechercher un club..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Rechercher un club..."
                  value={clubSearchQuery}
                  onValueChange={setClubSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>Aucun club trouvé.</CommandEmpty>
                  <CommandGroup>
                    {filteredClubs.map((club) => (
                      <CommandItem
                        key={club.id}
                        value={club.id}
                        onSelect={(currentValue) => {
                          setFormData({
                            ...formData,
                            clubId:
                              currentValue === formData.clubId
                                ? ""
                                : currentValue,
                          });
                          setIsClubSelectOpen(false);
                          setClubSearchQuery("");
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            formData.clubId === club.id
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        {club.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="season" className="flex items-center gap-1">
            Saison <span className="text-destructive">*</span>
          </Label>
          <Input
            id="season"
            placeholder="Ex: 2025-26"
            value={formData.season}
            onChange={(e) =>
              setFormData({ ...formData, season: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type" className="flex items-center gap-1">
            Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.type}
            onValueChange={(value: JerseyType) =>
              setFormData({ ...formData, type: value })
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Type de maillot" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(JERSEY_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.type === "SPECIAL" && (
        <div className="space-y-2">
          <Label htmlFor="specialName" className="flex items-center gap-1">
            Nom du maillot spécial{" "}
            <span className="text-muted-foreground text-xs font-normal">
              (optionnel)
            </span>
          </Label>
          <Input
            id="specialName"
            placeholder="Ex: Anniversaire, Édition limitée, Noël..."
            value={specialName}
            onChange={(e) => setSpecialName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Si vide, le nom sera &quot;Maillot Spécial [Club] [Saison]&quot;
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="brand" className="flex items-center gap-1">
          Marque <span className="text-destructive">*</span>
        </Label>
        <Input
          id="brand"
          placeholder="Ex: Nike, Adidas, Puma..."
          value={formData.brand}
          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optionnelle)</Label>
        <Textarea
          id="description"
          placeholder="Ajoutez une description ou des détails sur ce maillot..."
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          Photo du maillot <span className="text-destructive">*</span>
        </Label>

        {photoPreview ? (
          <div className="relative w-full aspect-square max-w-md bg-muted rounded-lg overflow-hidden">
            <Image
              src={photoPreview}
              alt="Aperçu"
              fill
              className="object-contain"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleRemovePhoto}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full max-w-md aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Camera className="w-12 h-12 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Cliquez pour ajouter</span> une
                photo
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WEBP (Max 2MB)
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handlePhotoChange}
            />
          </label>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || isUploadingPhoto}
          className="cursor-pointer"
        >
          {isUploadingPhoto ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              <span>Upload photo...</span>
            </div>
          ) : isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              <span>Envoi...</span>
            </div>
          ) : (
            <span>Soumettre la proposition</span>
          )}
        </Button>
      </div>
    </form>
  );
}
