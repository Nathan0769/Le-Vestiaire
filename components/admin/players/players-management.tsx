"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Users as UsersIcon, User, Check, ChevronsUpDown } from "lucide-react";
import Image from "next/image";

type PlayerPosition = "GOALKEEPER" | "DEFENDER" | "MIDFIELDER" | "FORWARD";

interface Club {
  id: string;
  name: string;
  shortName: string;
}

interface Player {
  id: string;
  name: string;
  number: number | null;
  position: PlayerPosition | null;
  photoUrl: string | null;
  goals: number | null;
  assists: number | null;
  matches: number | null;
  cleanSheets: number | null;
  goalsConceded: number | null;
}

interface PlayerFormData {
  name: string;
  number: string;
  position: PlayerPosition | undefined;
  photoUrl: string;
  goals: string;
  assists: string;
  matches: string;
  cleanSheets: string;
  goalsConceded: string;
}

const emptyForm: PlayerFormData = {
  name: "",
  number: "",
  position: undefined,
  photoUrl: "",
  goals: "",
  assists: "",
  matches: "",
  cleanSheets: "",
  goalsConceded: "",
};

const positionOptions: { value: PlayerPosition; label: string }[] = [
  { value: "GOALKEEPER", label: "Gardien" },
  { value: "DEFENDER", label: "Défenseur" },
  { value: "MIDFIELDER", label: "Milieu" },
  { value: "FORWARD", label: "Attaquant" },
];

export function PlayersManagement() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [clubSearchQuery, setClubSearchQuery] = useState("");
  const [isClubSelectOpen, setIsClubSelectOpen] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [season, setSeason] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeleteingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState<PlayerFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lire les paramètres de query string au chargement
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const clubIdParam = params.get("clubId");
    const seasonParam = params.get("season");

    if (clubIdParam) setSelectedClubId(clubIdParam);
    if (seasonParam) setSeason(seasonParam);
  }, []);

  // Charger la liste des clubs
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await fetch("/api/clubs");
        if (!response.ok) throw new Error("Erreur lors du chargement des clubs");
        const data = await response.json();
        setClubs(data);
        setFilteredClubs(data);
      } catch (error) {
        console.error("Error fetching clubs:", error);
        toast.error("Erreur lors du chargement des clubs");
      } finally {
        setIsLoadingClubs(false);
      }
    };

    fetchClubs();
  }, []);

  // Filtrer les clubs en fonction de la recherche
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

  // Charger les joueurs quand club et saison sont sélectionnés
  useEffect(() => {
    if (selectedClubId && season) {
      loadPlayers();
    } else {
      setPlayers([]);
    }
  }, [selectedClubId, season]);

  const loadPlayers = async () => {
    if (!selectedClubId || !season) return;

    setIsLoadingPlayers(true);
    try {
      const response = await fetch(
        `/api/admin/players?clubId=${selectedClubId}&season=${season}`
      );
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des joueurs");
      }
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error("Error loading players:", error);
      toast.error("Erreur lors du chargement des joueurs");
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  const openCreateDialog = () => {
    setEditingPlayer(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      number: player.number?.toString() || "",
      position: player.position || undefined,
      photoUrl: player.photoUrl || "",
      goals: player.goals?.toString() || "",
      assists: player.assists?.toString() || "",
      matches: player.matches?.toString() || "",
      cleanSheets: player.cleanSheets?.toString() || "",
      goalsConceded: player.goalsConceded?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (player: Player) => {
    setDeleteingPlayer(player);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Le nom du joueur est requis");
      return;
    }

    if (!selectedClubId || !season) {
      toast.error("Veuillez sélectionner un club et une saison");
      return;
    }

    setIsSubmitting(true);

    try {
      const basePayload = {
        name: formData.name.trim(),
        number: formData.number ? parseInt(formData.number) : null,
        position: formData.position || null,
        photoUrl: formData.photoUrl?.trim() || null,
        goals: formData.goals ? parseInt(formData.goals) : null,
        assists: formData.assists ? parseInt(formData.assists) : null,
        matches: formData.matches ? parseInt(formData.matches) : null,
        cleanSheets: formData.cleanSheets ? parseInt(formData.cleanSheets) : null,
        goalsConceded: formData.goalsConceded ? parseInt(formData.goalsConceded) : null,
      };

      let response;
      if (editingPlayer) {
        // Mise à jour
        response = await fetch(`/api/admin/players/${editingPlayer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(basePayload),
        });
      } else {
        // Création
        const createPayload = {
          ...basePayload,
          clubId: selectedClubId,
          season: season,
        };
        response = await fetch("/api/admin/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createPayload),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la sauvegarde");
      }

      toast.success(
        editingPlayer
          ? "Joueur modifié avec succès"
          : "Joueur créé avec succès"
      );
      setIsDialogOpen(false);
      setFormData(emptyForm);
      setEditingPlayer(null);
      await loadPlayers();
    } catch (error) {
      console.error("Error saving player:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPlayer) return;

    setIsSubmitting(true);
    setIsDeleteDialogOpen(false);

    try {
      const response = await fetch(`/api/admin/players/${deletingPlayer.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      toast.success("Joueur supprimé avec succès");
      setDeleteingPlayer(null);
      await loadPlayers();
    } catch (error) {
      console.error("Error deleting player:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la suppression"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPositionLabel = (position: PlayerPosition | null) => {
    if (!position) return null;
    return positionOptions.find((p) => p.value === position)?.label;
  };

  if (isLoadingClubs) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Filtres */}
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="club">Club</Label>
                <Popover open={isClubSelectOpen} onOpenChange={setIsClubSelectOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isClubSelectOpen}
                      className="w-full justify-between"
                      disabled={isLoadingClubs}
                    >
                      {selectedClubId
                        ? clubs.find((club) => club.id === selectedClubId)?.name
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
                        <CommandEmpty>Aucun club trouvé</CommandEmpty>
                        <CommandGroup>
                          {filteredClubs.map((club) => (
                            <CommandItem
                              key={club.id}
                              value={club.id}
                              onSelect={(currentValue) => {
                                const newClubId =
                                  currentValue === selectedClubId
                                    ? ""
                                    : currentValue;
                                setSelectedClubId(newClubId);
                                setIsClubSelectOpen(false);
                                setClubSearchQuery("");
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedClubId === club.id
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
                <Label htmlFor="season">Saison</Label>
                <Input
                  id="season"
                  placeholder="Ex: 2023-24"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={openCreateDialog}
                  disabled={!selectedClubId || !season || isLoadingPlayers}
                  className="w-full cursor-pointer gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un joueur
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des joueurs */}
        {isLoadingPlayers ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : selectedClubId && season ? (
          players.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <UsersIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Aucun joueur pour cette sélection
                  </p>
                  <Button onClick={openCreateDialog} className="cursor-pointer gap-2">
                    <Plus className="w-4 h-4" />
                    Ajouter le premier joueur
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {players.map((player) => (
                <Card key={player.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Photo */}
                      <div className="flex-shrink-0">
                        {player.photoUrl ? (
                          <Image
                            src={player.photoUrl}
                            alt={player.name}
                            width={64}
                            height={64}
                            className="rounded-lg object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                            <User className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold truncate">{player.name}</h3>
                            {player.position && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                {getPositionLabel(player.position)}
                              </Badge>
                            )}
                          </div>
                          {player.number && (
                            <div className="flex-shrink-0 text-2xl font-bold text-primary">
                              {player.number}
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        {(player.goals !== null ||
                          player.assists !== null ||
                          player.matches !== null ||
                          player.cleanSheets !== null ||
                          player.goalsConceded !== null) && (
                          <div className="text-xs text-muted-foreground space-y-1 mb-3">
                            {player.matches !== null && (
                              <div>{player.matches} matchs</div>
                            )}
                            {player.position === "GOALKEEPER" ? (
                              <>
                                {player.cleanSheets !== null && (
                                  <div>{player.cleanSheets} clean sheets</div>
                                )}
                                {player.goalsConceded !== null && (
                                  <div>{player.goalsConceded} buts encaissés</div>
                                )}
                              </>
                            ) : (
                              <>
                                {player.goals !== null && <div>{player.goals} buts</div>}
                                {player.assists !== null && (
                                  <div>{player.assists} passes</div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => openEditDialog(player)}
                            variant="outline"
                            size="sm"
                            className="cursor-pointer flex-1"
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            onClick={() => openDeleteDialog(player)}
                            variant="destructive"
                            size="sm"
                            className="cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <UsersIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Sélectionnez un club et une saison pour commencer
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog Création/Édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlayer ? "Modifier le joueur" : "Ajouter un joueur"}
            </DialogTitle>
            <DialogDescription>
              {editingPlayer
                ? "Modifiez les informations du joueur"
                : "Ajoutez un nouveau joueur à l'effectif"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Kylian Mbappé"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="number">Numéro</Label>
                <Input
                  id="number"
                  type="number"
                  min="1"
                  max="99"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  placeholder="Ex: 10"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="position">Position</Label>
                <Select
                  value={formData.position || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      position: value === "none" ? undefined : (value as PlayerPosition),
                    })
                  }
                >
                  <SelectTrigger id="position">
                    <SelectValue placeholder="Aucune position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {positionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="photoUrl">URL de la photo</Label>
              <Input
                id="photoUrl"
                type="url"
                value={formData.photoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, photoUrl: e.target.value })
                }
                placeholder="https://example.com/photo.jpg"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="matches">Matchs</Label>
              <Input
                id="matches"
                type="number"
                min="0"
                value={formData.matches}
                onChange={(e) =>
                  setFormData({ ...formData, matches: e.target.value })
                }
                placeholder="0"
              />
            </div>

            {formData.position === "GOALKEEPER" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cleanSheets">Clean Sheets</Label>
                  <Input
                    id="cleanSheets"
                    type="number"
                    min="0"
                    value={formData.cleanSheets}
                    onChange={(e) =>
                      setFormData({ ...formData, cleanSheets: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="goalsConceded">Buts encaissés</Label>
                  <Input
                    id="goalsConceded"
                    type="number"
                    min="0"
                    value={formData.goalsConceded}
                    onChange={(e) =>
                      setFormData({ ...formData, goalsConceded: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="goals">Buts</Label>
                  <Input
                    id="goals"
                    type="number"
                    min="0"
                    value={formData.goals}
                    onChange={(e) =>
                      setFormData({ ...formData, goals: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="assists">Passes</Label>
                  <Input
                    id="assists"
                    type="number"
                    min="0"
                    value={formData.assists}
                    onChange={(e) =>
                      setFormData({ ...formData, assists: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : editingPlayer ? (
                "Modifier"
              ) : (
                "Créer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {deletingPlayer?.name} ? Cette
              action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
