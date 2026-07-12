"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  PATCH_FAMILY_LABELS_FR,
  PATCH_FAMILY_ORDER,
  type PatchFamily,
} from "@/types/patch";
import {
  useCreatePatch,
  useUpdatePatch,
  type AdminPatch,
} from "@/hooks/admin/usePatchesAdmin";
import { ClubsMultiSelect } from "./clubs-multi-select";

interface PatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patch?: AdminPatch | null;
}

interface PatchFormBodyProps {
  patch?: AdminPatch | null;
  onOpenChange: (open: boolean) => void;
}

function PatchFormBody({ patch, onOpenChange }: PatchFormBodyProps) {
  const create = useCreatePatch();
  const update = useUpdatePatch();
  const isEdit = !!patch;

  const [name, setName] = useState(patch?.name ?? "");
  const [family, setFamily] = useState<PatchFamily>(
    patch?.family ?? "UEFA_COMPETITION",
  );
  const [leagueId, setLeagueId] = useState(patch?.leagueId ?? "");
  const [isActive, setIsActive] = useState(patch?.isActive ?? true);
  const [notes, setNotes] = useState(patch?.notes ?? "");
  const [eligibleClubIds, setEligibleClubIds] = useState<string[]>(
    patch?.eligibleClubIds ?? [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    const payload = {
      name: name.trim(),
      family,
      leagueId: leagueId.trim() || null,
      isActive,
      notes: notes.trim() || null,
      eligibleClubIds,
    };

    try {
      if (isEdit && patch) {
        await update.mutateAsync({ id: patch.id, data: payload });
        toast.success("Patch mis à jour");
      } else {
        await create.mutateAsync(payload);
        toast.success("Patch créé");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const isLoading = create.isPending || update.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Modifier le patch" : "Nouveau patch"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Modifier les informations du patch"
            : "Créer un nouveau patch dans le catalogue"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4" id="patch-form">
        <div className="space-y-2">
          <Label htmlFor="name">Nom</Label>
          <Input
            id="name"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: UCL Starball, Ligue 1 McDonalds"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="family">Famille</Label>
          <Select value={family} onValueChange={(v: PatchFamily) => setFamily(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PATCH_FAMILY_ORDER.map((f) => (
                <SelectItem key={f} value={f}>
                  {PATCH_FAMILY_LABELS_FR[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="leagueId">League ID (optionnel)</Label>
          <Input
            id="leagueId"
            value={leagueId}
            onChange={(e) => setLeagueId(e.target.value)}
            placeholder="Ex: ligue-1, premier-league"
          />
          <p className="text-xs text-muted-foreground">
            Requis pour DOMESTIC_*. Doit correspondre à un League.id existant.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Clubs éligibles (optionnel)</Label>
          <ClubsMultiSelect
            value={eligibleClubIds}
            onChange={setEligibleClubIds}
            leagueIds={family === "NATIONAL_TEAM_COMPETITION" ? ["national", "national-2"] : undefined}
          />
          <p className="text-xs text-muted-foreground">
            Vide = applicable à tous les clubs qui passent les autres filtres.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes internes (optionnel)</Label>
          <Textarea
            id="notes"
            value={notes}
            maxLength={500}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isActive"
            checked={isActive}
            onCheckedChange={(v) => setIsActive(!!v)}
          />
          <Label htmlFor="isActive">Actif</Label>
        </div>
      </form>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
          className="cursor-pointer"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          form="patch-form"
          disabled={isLoading}
          className="cursor-pointer"
        >
          {isLoading ? "..." : isEdit ? "Mettre à jour" : "Créer"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function PatchFormDialog({
  open,
  onOpenChange,
  patch,
}: PatchFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <PatchFormBody
          key={patch?.id ?? "new"}
          patch={patch}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}
