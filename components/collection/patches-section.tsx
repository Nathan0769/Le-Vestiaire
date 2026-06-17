"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useApplicablePatches } from "@/hooks/useApplicablePatches";
import {
  PATCH_FAMILY_LABELS_FR,
  PATCH_FAMILY_ORDER,
  type ApplicablePatch,
  type PatchFamily,
  type UserJerseyPatchInput,
} from "@/types/patch";

interface PatchesSectionProps {
  jerseyId: string;
  selectedPatches: UserJerseyPatchInput[];
  onChange: (patches: UserJerseyPatchInput[]) => void;
}

export function PatchesSection({
  jerseyId,
  selectedPatches,
  onChange,
}: PatchesSectionProps) {
  const { data, isLoading, isError } = useApplicablePatches(jerseyId);
  const [customDraft, setCustomDraft] = useState("");

  const patchesByFamily = useMemo(() => {
    const map = new Map<PatchFamily, ApplicablePatch[]>();
    for (const item of data ?? []) {
      const arr = map.get(item.patch.family) ?? [];
      arr.push(item);
      map.set(item.patch.family, arr);
    }
    return map;
  }, [data]);

  const selectedPatchIds = useMemo(
    () => new Set(selectedPatches.map((p) => p.patchId).filter(Boolean) as string[]),
    [selectedPatches]
  );

  const customPatches = selectedPatches.filter((p) => !p.patchId && p.customLabel);

  const togglePatch = (patchId: string) => {
    if (selectedPatchIds.has(patchId)) {
      onChange(selectedPatches.filter((p) => p.patchId !== patchId));
    } else {
      onChange([...selectedPatches, { patchId }]);
    }
  };

  const addCustomPatch = () => {
    const label = customDraft.trim();
    if (!label || label.length > 50) return;
    if (customPatches.some((p) => p.customLabel === label)) return;
    onChange([...selectedPatches, { customLabel: label }]);
    setCustomDraft("");
  };

  const removeCustomPatch = (label: string) => {
    onChange(selectedPatches.filter((p) => p.customLabel !== label));
  };

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Chargement des patches...</p>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Erreur lors du chargement des patches
      </p>
    );
  }

  const hasAny = (data?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      {!hasAny && (
        <p className="text-sm text-muted-foreground">
          Aucun patch disponible pour ce maillot
        </p>
      )}

      {PATCH_FAMILY_ORDER.filter((f) => f !== "CUSTOM").map((family) => {
        const items = patchesByFamily.get(family);
        if (!items || items.length === 0) return null;
        return (
          <div key={family} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">
              {PATCH_FAMILY_LABELS_FR[family]}
            </h4>
            <div className="space-y-2">
              {items.map((item) => {
                const checked = selectedPatchIds.has(item.patch.id);
                return (
                  <label
                    key={item.patch.id}
                    className="flex items-center gap-3 cursor-pointer rounded-md border p-2 hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => togglePatch(item.patch.id)}
                    />
                    {item.activeVersion?.imageUrl ? (
                      <div className="relative w-8 h-8 shrink-0">
                        <Image
                          src={item.activeVersion.imageUrl}
                          alt={item.patch.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted shrink-0" />
                    )}
                    <span className="text-sm">{item.patch.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="space-y-2 pt-2 border-t">
        <Label className="text-xs font-semibold uppercase text-muted-foreground">
          Patch personnalisé
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="Ex: 100 ans du club"
            value={customDraft}
            maxLength={50}
            onChange={(e) => setCustomDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomPatch();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={addCustomPatch}
            disabled={!customDraft.trim()}
          >
            Ajouter
          </Button>
        </div>
        {customPatches.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {customPatches.map((p) => (
              <span
                key={p.customLabel}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
              >
                {p.customLabel}
                <button
                  type="button"
                  className="cursor-pointer hover:text-destructive"
                  onClick={() => removeCustomPatch(p.customLabel!)}
                  aria-label={`Supprimer ${p.customLabel}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
