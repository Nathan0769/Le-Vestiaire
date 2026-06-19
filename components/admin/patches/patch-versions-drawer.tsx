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
import { Trash2 } from "lucide-react";
import {
  useCreatePatchVersion,
  useDeletePatchVersion,
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
  const remove = useDeletePatchVersion();
  const [seasonStart, setSeasonStart] = useState("");
  const [seasonEnd, setSeasonEnd] = useState("");
  const [file, setFile] = useState<File | null>(null);

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
            {patch?.versions.map((v) => (
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
                <div className="flex-1 text-sm">
                  <div>{v.seasonStart} → {v.seasonEnd ?? "actif"}</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer"
                  onClick={() => handleDelete(v.id)}
                  disabled={remove.isPending}
                  aria-label="Supprimer la version"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
