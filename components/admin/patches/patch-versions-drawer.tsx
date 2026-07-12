"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, Pencil, Trash2, X } from "lucide-react";
import {
  useCreatePatchVersion,
  useDeletePatchVersion,
  useUpdatePatchVersion,
  type AdminPatch,
} from "@/hooks/admin/usePatchesAdmin";
import { isYearFormat } from "@/lib/patches/season-format";

interface PatchVersionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patch: AdminPatch | null;
}

export function PatchVersionsDrawer({
  open,
  onOpenChange,
  patch,
}: PatchVersionsDrawerProps) {
  const create = useCreatePatchVersion();
  const update = useUpdatePatchVersion();
  const remove = useDeletePatchVersion();
  const [seasonStart, setSeasonStart] = useState("");
  const [seasonEnd, setSeasonEnd] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const useYear = patch ? isYearFormat(patch.family) : false;
  const formatRegex = useYear ? /^\d{4}$/ : /^\d{4}-\d{2}$/;
  const formatLabel = useYear ? "YYYY" : "YYYY-YY";
  const startLabel = useYear ? "Année début" : "Saison début";
  const endLabel = useYear ? "Année fin" : "Saison fin";
  const startPlaceholder = useYear ? "2024" : "2024-25";
  const endPlaceholder = useYear
    ? "2026 (vide = actif)"
    : "2025-26 (vide = actif)";

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patch) return;

    if (!formatRegex.test(seasonStart)) {
      toast.error(`${startLabel} invalide (format ${formatLabel})`);
      return;
    }
    if (seasonEnd && !formatRegex.test(seasonEnd)) {
      toast.error(`${endLabel} invalide (format ${formatLabel})`);
      return;
    }
    if (seasonEnd && seasonEnd < seasonStart) {
      toast.error("La fin doit être postérieure ou égale au début");
      return;
    }

    try {
      await create.mutateAsync({
        patchId: patch.id,
        seasonStart,
        seasonEnd: seasonEnd || null,
        file,
      });
      toast.success("Version créée");
      setSeasonStart("");
      setSeasonEnd("");
      setFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const startEdit = (version: {
    id: string;
    seasonStart: string;
    seasonEnd: string | null;
  }) => {
    setEditingId(version.id);
    setEditStart(version.seasonStart);
    setEditEnd(version.seasonEnd ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditStart("");
    setEditEnd("");
  };

  const handleSaveEdit = async (versionId: string) => {
    if (!patch) return;

    if (!formatRegex.test(editStart)) {
      toast.error(`${startLabel} invalide (format ${formatLabel})`);
      return;
    }
    if (editEnd && !formatRegex.test(editEnd)) {
      toast.error(`${endLabel} invalide (format ${formatLabel})`);
      return;
    }
    if (editEnd && editEnd < editStart) {
      toast.error("La fin doit être postérieure ou égale au début");
      return;
    }

    try {
      await update.mutateAsync({
        patchId: patch.id,
        versionId,
        seasonStart: editStart,
        seasonEnd: editEnd || null,
      });
      toast.success("Version mise à jour");
      cancelEdit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDelete = async (versionId: string) => {
    if (!patch) return;
    if (!confirm("Supprimer cette version et son image ?")) return;
    try {
      await remove.mutateAsync({ patchId: patch.id, versionId });
      toast.success("Version supprimée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Versions de {patch?.name ?? "..."}</SheetTitle>
          <SheetDescription>
            Une version par tranche de {useYear ? "années" : "saisons"}. Fin vide = encore actif.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 space-y-6">
          <form onSubmit={handleAdd} className="space-y-3 border rounded-lg p-3">
            <h4 className="font-semibold text-sm">Nouvelle version</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="ss">{startLabel}</Label>
                <Input
                  id="ss"
                  placeholder={startPlaceholder}
                  value={seasonStart}
                  onChange={(e) => setSeasonStart(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="se">{endLabel}</Label>
                <Input
                  id="se"
                  placeholder={endPlaceholder}
                  value={seasonEnd}
                  onChange={(e) => setSeasonEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="file">Image (PNG/WebP/AVIF/JPEG, max 2 MB)</Label>
              <Input
                id="file"
                type="file"
                accept="image/png,image/webp,image/jpeg,image/avif,image/jxl"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button
              type="submit"
              disabled={create.isPending}
              className="w-full cursor-pointer"
            >
              {create.isPending ? "..." : "Ajouter la version"}
            </Button>
          </form>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Versions existantes</h4>
            {patch && patch.versions.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune version</p>
            )}
            {patch?.versions.map((v) => {
              const isEditing = editingId === v.id;
              return (
                <div
                  key={v.id}
                  className="flex items-center gap-3 border rounded-md p-2"
                >
                  {v.imageUrl ? (
                    <div className="relative w-10 h-10 shrink-0">
                      <Image
                        src={v.imageUrl}
                        alt={v.seasonStart}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted shrink-0" />
                  )}
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        value={editStart}
                        onChange={(e) => setEditStart(e.target.value)}
                        placeholder={startPlaceholder}
                        className="h-8 text-sm"
                        aria-label={startLabel}
                      />
                      <Input
                        value={editEnd}
                        onChange={(e) => setEditEnd(e.target.value)}
                        placeholder={endPlaceholder}
                        className="h-8 text-sm"
                        aria-label={endLabel}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 text-sm">
                      <div>{v.seasonStart} → {v.seasonEnd ?? "actif"}</div>
                    </div>
                  )}
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer"
                        onClick={() => handleSaveEdit(v.id)}
                        disabled={update.isPending}
                        aria-label="Enregistrer"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer"
                        onClick={cancelEdit}
                        disabled={update.isPending}
                        aria-label="Annuler"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer"
                        onClick={() => startEdit(v)}
                        disabled={editingId !== null}
                        aria-label="Modifier les dates"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer"
                        onClick={() => handleDelete(v.id)}
                        disabled={remove.isPending || editingId !== null}
                        aria-label="Supprimer la version"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
