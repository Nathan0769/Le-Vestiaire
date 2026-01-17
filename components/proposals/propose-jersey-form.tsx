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
import { useTranslations } from "next-intl";

interface Club {
  id: string;
  name: string;
  shortName: string;
  league: {
    id: string;
  };
}

interface ProposeJerseyFormProps {
  onSuccess?: () => void;
}

export function ProposeJerseyForm({ onSuccess }: ProposeJerseyFormProps) {
  const tJerseyType = useTranslations("JerseyType");
  const t = useTranslations("Proposals.Form");
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
  const [seasonError, setSeasonError] = useState<string | null>(null);

  const NATIONAL_TEAM_LEAGUES = ["conmebol", "caf", "concacaf", "uefa"];
  const CALENDAR_YEAR_LEAGUES = ["mls", "brasileiro-serie-a"]; // Ligues fonctionnant par année civile

  useEffect(() => {
    const loadClubs = async () => {
      try {
        const response = await fetch("/api/clubs");
        if (!response.ok) throw new Error("Erreur chargement clubs");
        const data = await response.json();
        setClubs(data);
        setFilteredClubs(data);
      } catch (error) {
        console.error("Error loading clubs:", error);
        toast.error(t("clubNotFound"));
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
        ? specialName.trim() || tJerseyType("SPECIAL")
        : tJerseyType(formData.type);

    const generatedName = t("generatedJerseyName", {
      type: typeLabel,
      club: selectedClub.shortName,
      season: formData.season,
    });

    setFormData((prev) => ({ ...prev, name: generatedName }));
  }, [
    formData.clubId,
    formData.season,
    formData.type,
    specialName,
    clubs,
    t,
    tJerseyType,
  ]);

  const validateSeasonFormat = (
    season: string,
    clubId: string
  ): string | null => {
    if (!season || !clubId) return null;

    const selectedClub = clubs.find((club) => club.id === clubId);
    if (!selectedClub) return null;

    const leagueId = selectedClub.league.id.toLowerCase();
    const isYearFormat = NATIONAL_TEAM_LEAGUES.includes(leagueId) ||
                        CALENDAR_YEAR_LEAGUES.includes(leagueId);

    if (isYearFormat) {
      // Format YYYY pour sélections nationales et ligues par année civile
      const yearRegex = /^\d{4}$/;
      if (!yearRegex.test(season)) {
        return t("seasonErrorNationalTeam");
      }
    } else {
      // Format YYYY-YY pour clubs (saison)
      const clubSeasonRegex = /^\d{4}-\d{2}$/;
      if (!clubSeasonRegex.test(season)) {
        return t("seasonErrorClub");
      }
    }

    return null;
  };

  const handleSeasonChange = (value: string) => {
    setFormData({ ...formData, season: value });

    if (formData.clubId) {
      const error = validateSeasonFormat(value, formData.clubId);
      setSeasonError(error);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("errorFileNotImage"));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("errorFileTooLarge"));
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
      toast.error(t("errorAllFieldsRequired"));
      return;
    }

    const seasonValidationError = validateSeasonFormat(
      formData.season,
      formData.clubId
    );
    if (seasonValidationError) {
      toast.error(seasonValidationError);
      setSeasonError(seasonValidationError);
      return;
    }

    if (!photoFile) {
      toast.error(t("errorPhotoRequired"));
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
        throw new Error(error.error || t("errorUpload"));
      }

      const { url } = await uploadResponse.json();
      imageUrl = url;
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error(
        error instanceof Error ? error.message : t("errorUploadToast")
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
        throw new Error(error.error || t("errorCreate"));
      }

      toast.success(t("successToast"));

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
      console.error("Error creating proposal:", error);
      toast.error(
        error instanceof Error ? error.message : t("errorCreateToast")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-1">
          {t("jerseyNameLabel")}{" "}
          <span className="text-muted-foreground text-xs font-normal">
            {t("autoGenerated")}
          </span>
        </Label>
        <Input
          id="name"
          placeholder={t("jerseyNamePlaceholder")}
          value={formData.name}
          disabled
          className="bg-muted"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="club" className="flex items-center gap-1">
            {t("clubLabel")}
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
                  ? t("clubLoading")
                  : t("clubSearchPlaceholder")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder={t("clubCommandPlaceholder")}
                  value={clubSearchQuery}
                  onValueChange={setClubSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>{t("clubNotFound")}</CommandEmpty>
                  <CommandGroup>
                    {filteredClubs.map((club) => (
                      <CommandItem
                        key={club.id}
                        value={club.id}
                        onSelect={(currentValue) => {
                          const newClubId =
                            currentValue === formData.clubId
                              ? ""
                              : currentValue;
                          setFormData({
                            ...formData,
                            clubId: newClubId,
                          });
                          setIsClubSelectOpen(false);
                          setClubSearchQuery("");

                          if (formData.season && newClubId) {
                            const error = validateSeasonFormat(
                              formData.season,
                              newClubId
                            );
                            setSeasonError(error);
                          } else {
                            setSeasonError(null);
                          }
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
            {t("seasonLabel")}
          </Label>
          <Input
            id="season"
            placeholder={
              formData.clubId &&
              clubs.find((club) => club.id === formData.clubId) &&
              (() => {
                const leagueId = clubs
                  .find((club) => club.id === formData.clubId)!
                  .league.id.toLowerCase();
                return NATIONAL_TEAM_LEAGUES.includes(leagueId) ||
                       CALENDAR_YEAR_LEAGUES.includes(leagueId);
              })()
                ? t("seasonPlaceholderNationalTeam")
                : t("seasonPlaceholder")
            }
            value={formData.season}
            onChange={(e) => handleSeasonChange(e.target.value)}
            required
            className={seasonError ? "border-red-500" : ""}
          />
          {seasonError && <p className="text-sm text-red-500">{seasonError}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type" className="flex items-center gap-1">
            {t("typeLabel")}
          </Label>
          <Select
            value={formData.type}
            onValueChange={(value: JerseyType) =>
              setFormData({ ...formData, type: value })
            }
            required
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("typePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {Object.values(JerseyType).map((type) => (
                <SelectItem key={type} value={type}>
                  {tJerseyType(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.type === "SPECIAL" && (
        <div className="space-y-2">
          <Label htmlFor="specialName" className="flex items-center gap-1">
            {t("specialNameLabel")}{" "}
            <span className="text-muted-foreground text-xs font-normal">
              {t("specialNameOptional")}
            </span>
          </Label>
          <Input
            id="specialName"
            placeholder={t("specialNamePlaceholder")}
            value={specialName}
            onChange={(e) => setSpecialName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {t("specialNameHelper")}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="brand" className="flex items-center gap-1">
          {t("brandLabel")}
        </Label>
        <Input
          id="brand"
          placeholder={t("brandPlaceholder")}
          value={formData.brand}
          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("descriptionLabel")}</Label>
        <Textarea
          id="description"
          placeholder={t("descriptionPlaceholder")}
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1">{t("photoLabel")}</Label>

        {photoPreview ? (
          <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
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
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Camera className="w-12 h-12 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">{t("photoClickToAdd")}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {t("photoFormats")}
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

      <div className="flex justify-center pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || isUploadingPhoto}
          className="cursor-pointer w-full md:w-64"
        >
          {isUploadingPhoto ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              <span>{t("buttonUploading")}</span>
            </div>
          ) : isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              <span>{t("buttonSubmitting")}</span>
            </div>
          ) : (
            <span>{t("buttonSubmit")}</span>
          )}
        </Button>
      </div>
    </form>
  );
}
