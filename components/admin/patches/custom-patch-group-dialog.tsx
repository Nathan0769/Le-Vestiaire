"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Link2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PATCH_FAMILY_LABELS_FR, type CustomPatchGroup } from "@/types/patch";
import { useAdminPatches, type AdminPatch } from "@/hooks/admin/usePatchesAdmin";
import {
  useDeleteCustomPatches,
  useLinkCustomPatches,
  useRenameCustomPatches,
} from "@/hooks/admin/useCustomPatchesAdmin";
import { PatchFormDialog } from "./patch-form-dialog";

type Mode = "link" | "rename" | null;

interface CustomPatchGroupDialogProps {
  group: CustomPatchGroup | null;
  onOpenChange: (open: boolean) => void;
}

export function CustomPatchGroupDialog({
  group,
  onOpenChange,
}: CustomPatchGroupDialogProps) {
  return (
    <Dialog open={group !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {group && (
          <GroupBody
            key={group.key}
            group={group}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function GroupBody({
  group,
  onClose,
}: {
  group: CustomPatchGroup;
  onClose: () => void;
}) {
  const { data: patches } = useAdminPatches();
  const link = useLinkCustomPatches();
  const rename = useRenameCustomPatches();
  const remove = useDeleteCustomPatches();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(group.occurrences.map((o) => o.id))
  );
  const [mode, setMode] = useState<Mode>(null);
  const [targetPatch, setTargetPatch] = useState<AdminPatch | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [extendEligibility, setExtendEligibility] = useState(true);
  const [newLabel, setNewLabel] = useState(group.label);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const ids = useMemo(() => [...selectedIds], [selectedIds]);
  const allSelected = selectedIds.size === group.occurrences.length;
  const isPending = link.isPending || rename.isPending || remove.isPending;

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(
      allSelected ? new Set() : new Set(group.occurrences.map((o) => o.id))
    );
  };

  const handleLink = async () => {
    if (!targetPatch) return;
    try {
      const res = await link.mutateAsync({
        ids,
        patchId: targetPatch.id,
        extendEligibility,
      });
      toast.success(
        `${res.updated} rattaché(s) à ${targetPatch.name}` +
          (res.deleted > 0 ? `, ${res.deleted} doublon(s) retiré(s)` : "")
      );
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleRename = async () => {
    const label = newLabel.trim();
    if (!label) return;
    try {
      const res = await rename.mutateAsync({ ids, label });
      toast.success(`${res.count} patch(s) renommé(s)`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await remove.mutateAsync({ ids });
      toast.success(`${res.count} patch(s) supprimé(s)`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{group.label}</DialogTitle>
        <DialogDescription>
          {group.count} occurrence{group.count > 1 ? "s" : ""}
          {group.variants.length > 1 &&
            ` - variantes : ${group.variants.join(", ")}`}
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-72 overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Tout sélectionner"
                />
              </TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Maillot</TableHead>
              <TableHead>Saisie</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.occurrences.map((o) => (
              <TableRow
                key={o.id}
                className="cursor-pointer"
                onClick={() => toggle(o.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(o.id)}
                    onCheckedChange={() => toggle(o.id)}
                  />
                </TableCell>
                <TableCell className="text-sm">
                  {o.username ? `@${o.username}` : "-"}
                </TableCell>
                <TableCell className="text-sm">
                  <div>{o.jersey.clubName}</div>
                  <div className="text-xs text-muted-foreground">
                    {o.jersey.name} - {o.jersey.season}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{o.customLabel}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={mode === "link" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode(mode === "link" ? null : "link")}
          className="cursor-pointer"
        >
          <Link2 className="h-4 w-4 mr-1" />
          Rattacher
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1" />
          Créer un patch
        </Button>
        <Button
          variant={mode === "rename" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode(mode === "rename" ? null : "rename")}
          className="cursor-pointer"
        >
          <Pencil className="h-4 w-4 mr-1" />
          Renommer
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmDelete(true)}
          disabled={ids.length === 0}
          className="cursor-pointer text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Supprimer
        </Button>
      </div>

      {mode === "link" && (
        <div className="space-y-3 rounded-md border p-3">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={pickerOpen}
                className="w-full justify-between cursor-pointer"
              >
                <span className={cn(!targetPatch && "text-muted-foreground")}>
                  {targetPatch?.name ?? "Choisir un patch du catalogue"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
            >
              <Command>
                <CommandInput placeholder="Rechercher un patch..." />
                <CommandList>
                  <CommandEmpty>Aucun patch trouvé.</CommandEmpty>
                  <CommandGroup>
                    {(patches ?? []).map((p) => (
                      <CommandItem
                        key={p.id}
                        value={`${p.name} ${p.id}`}
                        onSelect={() => {
                          setTargetPatch(p);
                          setPickerOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            targetPatch?.id === p.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="flex-1">{p.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {PATCH_FAMILY_LABELS_FR[p.family]}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={extendEligibility}
              onCheckedChange={(v) => setExtendEligibility(v === true)}
            />
            Étendre l&apos;éligibilité aux clubs concernés
          </label>

          <Button
            size="sm"
            onClick={handleLink}
            disabled={!targetPatch || ids.length === 0 || isPending}
            className="cursor-pointer"
          >
            {link.isPending
              ? "Rattachement..."
              : `Rattacher ${ids.length} occurrence${ids.length > 1 ? "s" : ""}`}
          </Button>
        </div>
      )}

      {mode === "rename" && (
        <div className="space-y-3 rounded-md border p-3">
          <div className="space-y-2">
            <Label htmlFor="custom-patch-label">Nouveau libellé</Label>
            <Input
              id="custom-patch-label"
              value={newLabel}
              maxLength={50}
              onChange={(e) => setNewLabel(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            onClick={handleRename}
            disabled={!newLabel.trim() || ids.length === 0 || isPending}
            className="cursor-pointer"
          >
            {rename.isPending
              ? "Renommage..."
              : `Renommer ${ids.length} occurrence${ids.length > 1 ? "s" : ""}`}
          </Button>
        </div>
      )}

      <PatchFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultName={group.label}
        onCreated={(created) => {
          setTargetPatch(created);
          setMode("link");
        }}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ces patchs perso ?</AlertDialogTitle>
            <AlertDialogDescription>
              {ids.length} patch{ids.length > 1 ? "s" : ""} perso{" "}
              {ids.length > 1 ? "seront retirés" : "sera retiré"} des maillots
              concernés. Les maillots restent dans les collections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="cursor-pointer bg-destructive text-white hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
