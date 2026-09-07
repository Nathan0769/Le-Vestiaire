"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Edit3, Trash2, Image as ImageIcon, Layers } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminPatches,
  useDeletePatch,
  type AdminPatch,
} from "@/hooks/admin/usePatchesAdmin";
import {
  PATCH_FAMILY_LABELS_FR,
  PATCH_FAMILY_ORDER,
  type PatchFamily,
} from "@/types/patch";
import { PatchFormDialog } from "./patch-form-dialog";
import { PatchVersionsDrawer } from "./patch-versions-drawer";

type StatusFilter = "all" | "active" | "inactive";
type GroupBy = "league" | "family";

const NO_LEAGUE_KEY = "__none__";

interface PatchGroup {
  key: string;
  label: string;
  sublabel?: string;
  patches: AdminPatch[];
}

export function PatchesManagement() {
  const { data, isLoading, isError } = useAdminPatches();
  const remove = useDeletePatch();
  const [editing, setEditing] = useState<AdminPatch | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versionsPatchId, setVersionsPatchId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminPatch | null>(null);

  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState<PatchFamily | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("league");

  const versionsPatch = versionsPatchId
    ? data?.find((p) => p.id === versionsPatchId) ?? null
    : null;

  const familyRank = (family: PatchFamily) => {
    const idx = PATCH_FAMILY_ORDER.indexOf(family);
    return idx === -1 ? PATCH_FAMILY_ORDER.length : idx;
  };

  // Applique les filtres recherche/famille/statut puis regroupe les patches,
  // soit par league (bucket "Sans league" en dernier), soit par famille dans
  // l'ordre sémantique. Chaque groupe est trié de façon stable et lisible.
  const groups = useMemo<PatchGroup[]>(() => {
    if (!data) return [];

    const query = search.trim().toLowerCase();
    const filtered = data.filter((patch) => {
      if (familyFilter !== "all" && patch.family !== familyFilter) return false;
      if (statusFilter === "active" && !patch.isActive) return false;
      if (statusFilter === "inactive" && patch.isActive) return false;
      if (query) {
        const haystack = `${patch.name} ${patch.league?.name ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    if (groupBy === "family") {
      return PATCH_FAMILY_ORDER.map((family) => ({
        key: family,
        label: PATCH_FAMILY_LABELS_FR[family],
        patches: filtered
          .filter((p) => p.family === family)
          .sort((a, b) => a.name.localeCompare(b.name)),
      })).filter((g) => g.patches.length > 0);
    }

    // Groupement par league
    const byLeague = new Map<string, PatchGroup>();
    for (const patch of filtered) {
      const key = patch.league?.id ?? NO_LEAGUE_KEY;
      if (!byLeague.has(key)) {
        byLeague.set(key, {
          key,
          label: patch.league?.name ?? "Sans league",
          sublabel: patch.league?.country ?? undefined,
          patches: [],
        });
      }
      byLeague.get(key)!.patches.push(patch);
    }

    const result = [...byLeague.values()];
    // Tri par nom de league, en repoussant "Sans league" à la fin.
    result.sort((a, b) => {
      if (a.key === NO_LEAGUE_KEY) return 1;
      if (b.key === NO_LEAGUE_KEY) return -1;
      return a.label.localeCompare(b.label);
    });
    // Dans chaque league : famille (ordre sémantique) puis nom.
    for (const group of result) {
      group.patches.sort(
        (a, b) =>
          familyRank(a.family) - familyRank(b.family) ||
          a.name.localeCompare(b.name)
      );
    }
    return result;
  }, [data, search, familyFilter, statusFilter, groupBy]);

  const totalFiltered = groups.reduce((sum, g) => sum + g.patches.length, 0);
  const groupKeys = groups.map((g) => g.key);
  const groupNoun = groupBy === "league" ? "league" : "famille";

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (patch: AdminPatch) => {
    setEditing(patch);
    setFormOpen(true);
  };

  const openVersions = (patch: AdminPatch) => {
    setVersionsPatchId(patch.id);
    setVersionsOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      toast.success("Patch supprimé");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="sm:max-w-xs sm:flex-1">
            {/* SearchInput porte une marge basse par défaut, neutralisée ici */}
            <div className="[&_input]:mb-0">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Rechercher un patch ou une league..."
              />
            </div>
          </div>

          <Select
            value={familyFilter}
            onValueChange={(v) => setFamilyFilter(v as PatchFamily | "all")}
          >
            <SelectTrigger className="w-full cursor-pointer sm:w-56">
              <SelectValue placeholder="Famille" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les familles</SelectItem>
              {PATCH_FAMILY_ORDER.map((family) => (
                <SelectItem key={family} value={family}>
                  {PATCH_FAMILY_LABELS_FR[family]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-full cursor-pointer sm:w-36">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Inactifs</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={groupBy}
            onValueChange={(v) => setGroupBy(v as GroupBy)}
          >
            <SelectTrigger className="w-full cursor-pointer sm:w-44">
              <SelectValue placeholder="Grouper par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="league">Grouper par league</SelectItem>
              <SelectItem value="family">Grouper par famille</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={openCreate} className="cursor-pointer shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau patch
        </Button>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      )}
      {isError && (
        <p className="text-sm text-destructive">Erreur de chargement</p>
      )}

      {data && groups.length === 0 && (
        <div className="rounded-md border py-12 text-center text-sm text-muted-foreground">
          {data.length === 0
            ? "Aucun patch dans le catalogue"
            : "Aucun patch ne correspond aux filtres"}
        </div>
      )}

      {data && groups.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {totalFiltered} patch{totalFiltered > 1 ? "es" : ""} dans{" "}
            {groups.length} {groupNoun}
            {groups.length > 1 ? "s" : ""}
          </p>

          <Accordion
            key={groupBy}
            type="multiple"
            defaultValue={groupKeys}
            className="rounded-md border divide-y"
          >
            {groups.map((group) => (
              <AccordionItem
                key={group.key}
                value={group.key}
                className="border-b-0 px-4"
              >
                <AccordionTrigger className="cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    {group.label}
                    {group.sublabel && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {group.sublabel}
                      </span>
                    )}
                    <Badge variant="secondary" className="ml-1">
                      {group.patches.length}
                    </Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14"></TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>
                          {groupBy === "league" ? "Famille" : "League"}
                        </TableHead>
                        <TableHead className="text-center">Versions</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.patches.map((patch) => {
                        const thumb = patch.versions.find(
                          (v) => v.imageUrl
                        )?.imageUrl;
                        return (
                          <TableRow key={patch.id}>
                            <TableCell>
                              <div className="relative h-9 w-9 overflow-hidden rounded border bg-muted">
                                {thumb ? (
                                  <Image
                                    src={thumb}
                                    alt={patch.name}
                                    fill
                                    className="object-contain p-0.5"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                    <ImageIcon className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {patch.name}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {groupBy === "league"
                                ? PATCH_FAMILY_LABELS_FR[patch.family]
                                : patch.league?.name ?? "-"}
                            </TableCell>
                            <TableCell className="text-center tabular-nums">
                              {patch.versions.length}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={patch.isActive ? "default" : "secondary"}
                              >
                                {patch.isActive ? "Actif" : "Inactif"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openVersions(patch)}
                                className="cursor-pointer"
                                aria-label="Gérer les versions"
                              >
                                <ImageIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(patch)}
                                className="cursor-pointer"
                                aria-label="Modifier"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTarget(patch)}
                                className="cursor-pointer"
                                aria-label="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </>
      )}

      <PatchFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patch={editing}
      />

      <PatchVersionsDrawer
        open={versionsOpen}
        onOpenChange={(o) => {
          setVersionsOpen(o);
          if (!o) setVersionsPatchId(null);
        }}
        patch={versionsPatch}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le patch ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les versions et images seront supprimées. Les UserJerseyPatch
              existants conservent leur trace (patchId mis à null).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="cursor-pointer"
              disabled={remove.isPending}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
