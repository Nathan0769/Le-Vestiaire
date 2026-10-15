"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { useCustomPatches } from "@/hooks/admin/useCustomPatchesAdmin";
import { normalizeCustomLabel } from "@/lib/patches/custom-patch-label";
import type { CustomPatchGroup } from "@/types/patch";
import { CustomPatchGroupDialog } from "./custom-patch-group-dialog";

const MAX_VARIANTS = 3;
const MAX_CLUBS = 3;

export function CustomPatchesPanel() {
  const { data: groups, isLoading, isError } = useCustomPatches();
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = normalizeCustomLabel(search);
    if (!query) return groups ?? [];
    return (groups ?? []).filter((g) => g.key.includes(query));
  }, [groups, search]);

  // Résolu depuis les données fraîches : après une action partielle, le groupe
  // reflète les occurrences restantes (ou disparaît).
  const openGroup: CustomPatchGroup | null =
    groups?.find((g) => g.key === openKey) ?? null;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Erreur lors du chargement des patchs perso
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Rechercher un patch perso..."
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun patch perso</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé</TableHead>
                <TableHead>Variantes</TableHead>
                <TableHead className="text-right">Occurrences</TableHead>
                <TableHead>Clubs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((g) => {
                const otherVariants = g.variants.filter((v) => v !== g.label);
                const clubs = [
                  ...new Set(g.occurrences.map((o) => o.jersey.clubName)),
                ];
                return (
                  <TableRow
                    key={g.key}
                    className="cursor-pointer"
                    onClick={() => setOpenKey(g.key)}
                  >
                    <TableCell className="font-medium">{g.label}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {otherVariants.slice(0, MAX_VARIANTS).map((v) => (
                          <Badge key={v} variant="secondary">
                            {v}
                          </Badge>
                        ))}
                        {otherVariants.length > MAX_VARIANTS && (
                          <Badge variant="outline">
                            +{otherVariants.length - MAX_VARIANTS}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{g.count}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {clubs.slice(0, MAX_CLUBS).join(", ")}
                      {clubs.length > MAX_CLUBS && ` +${clubs.length - MAX_CLUBS}`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CustomPatchGroupDialog
        group={openGroup}
        onOpenChange={(open) => {
          if (!open) setOpenKey(null);
        }}
      />
    </div>
  );
}
