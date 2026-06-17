"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Edit3, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminPatches,
  useDeletePatch,
  type AdminPatch,
} from "@/hooks/admin/usePatchesAdmin";
import { PATCH_FAMILY_LABELS_FR } from "@/types/patch";
import { PatchFormDialog } from "./patch-form-dialog";
import { PatchVersionsDrawer } from "./patch-versions-drawer";

export function PatchesManagement() {
  const { data, isLoading, isError } = useAdminPatches();
  const remove = useDeletePatch();
  const [editing, setEditing] = useState<AdminPatch | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versionsPatchId, setVersionsPatchId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminPatch | null>(null);

  const versionsPatch = versionsPatchId
    ? data?.find((p) => p.id === versionsPatchId) ?? null
    : null;

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
      <div className="flex justify-end">
        <Button onClick={openCreate} className="cursor-pointer">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau patch
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}
      {isError && <p className="text-sm text-destructive">Erreur de chargement</p>}

      {data && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Famille</TableHead>
                <TableHead>League</TableHead>
                <TableHead>Versions</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((patch) => (
                <TableRow key={patch.id}>
                  <TableCell className="font-medium">{patch.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {PATCH_FAMILY_LABELS_FR[patch.family]}
                  </TableCell>
                  <TableCell className="text-xs">
                    {patch.league?.name ?? "-"}
                  </TableCell>
                  <TableCell>{patch.versions.length}</TableCell>
                  <TableCell>
                    <Badge variant={patch.isActive ? "default" : "secondary"}>
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
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucun patch dans le catalogue
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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
            <AlertDialogCancel className="cursor-pointer">Annuler</AlertDialogCancel>
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
