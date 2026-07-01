"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  useAdminClubLeagues,
  useApplySeasonAsCurrent,
  useCreateClubLeague,
  useDeleteClubLeague,
  type AdminClubLeague,
} from "@/hooks/admin/useClubLeaguesAdmin";
import { useSearchClubs } from "@/hooks/useSearchClubs";
import { SEASON_REGEX } from "@/lib/patches/season-format";

type LeagueOption = { id: string; name: string; country: string };

type Props = {
  leagues: LeagueOption[];
};

export function ClubLeaguesManagement({ leagues }: Props) {
  const [leagueId, setLeagueId] = useState<string>("");
  const [seasonInput, setSeasonInput] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<AdminClubLeague | null>(null);
  const [applyConfirmOpen, setApplyConfirmOpen] = useState(false);

  const seasonValid = SEASON_REGEX.test(seasonInput);
  const season = seasonValid ? seasonInput : "";

  const { data, isLoading, isError } = useAdminClubLeagues(leagueId, season);
  const create = useCreateClubLeague();
  const remove = useDeleteClubLeague();
  const applySeason = useApplySeasonAsCurrent();

  const groupedLeagues = useMemo(() => {
    const map = new Map<string, LeagueOption[]>();
    for (const l of leagues) {
      if (!map.has(l.country)) map.set(l.country, []);
      map.get(l.country)!.push(l);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [leagues]);

  const selectedCountry = useMemo(
    () => leagues.find((l) => l.id === leagueId)?.country,
    [leagues, leagueId]
  );

  const existingClubIds = useMemo(
    () => new Set((data ?? []).map((e) => e.clubId)),
    [data]
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      toast.success("Entrée supprimée");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleAddClub = async (clubId: string) => {
    if (!leagueId || !season) return;
    try {
      await create.mutateAsync({ clubId, season, leagueId });
      toast.success("Club ajouté");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleApplySeason = async () => {
    if (!season) return;
    try {
      const result = await applySeason.mutateAsync(season);
      if (result.total === 0) {
        toast.info(`Aucune entrée pour la saison ${season}`);
      } else if (result.updated === 0) {
        toast.info(
          `Saison ${season} déjà alignée (${result.total} clubs vérifiés)`
        );
      } else {
        toast.success(
          `${result.updated} club${result.updated > 1 ? "s" : ""} mis à jour sur ${result.total}`
        );
      }
      setApplyConfirmOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const filtersReady = Boolean(leagueId && season);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Ligue</label>
          <Select value={leagueId} onValueChange={setLeagueId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir une ligue" />
            </SelectTrigger>
            <SelectContent>
              {groupedLeagues.map(([country, leaguesInCountry]) => (
                <SelectGroup key={country}>
                  <SelectLabel>{country}</SelectLabel>
                  {leaguesInCountry.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Saison (format YYYY-YY)
          </label>
          <Input
            value={seasonInput}
            onChange={(e) => setSeasonInput(e.target.value.trim())}
            placeholder="ex: 2010-11"
          />
          {seasonInput && !seasonValid && (
            <p className="text-xs text-destructive mt-1">
              Format attendu : YYYY-YY (ex: 2010-11)
            </p>
          )}
        </div>
      </div>

      {seasonValid && (
        <div className="flex items-start justify-between gap-4 rounded-md border border-dashed p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Appliquer la saison {season} comme saison courante
            </p>
            <p className="text-xs text-muted-foreground">
              Met à jour la ligue actuelle de tous les clubs ayant une entrée
              pour {season}. Utile après une vague de promotions/relégations.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setApplyConfirmOpen(true)}
            disabled={applySeason.isPending}
            className="cursor-pointer shrink-0"
          >
            {applySeason.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            Appliquer
          </Button>
        </div>
      )}

      {!filtersReady && (
        <p className="text-sm text-muted-foreground">
          Sélectionnez une ligue et une saison valide pour voir et gérer les
          clubs liés.
        </p>
      )}

      {filtersReady && (
        <>
          <AddClubForm
            disabled={create.isPending}
            existingClubIds={existingClubIds}
            country={selectedCountry}
            onAdd={handleAddClub}
          />

          {isLoading && (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          )}
          {isError && (
            <p className="text-sm text-destructive">
              Erreur lors du chargement
            </p>
          )}

          {data && data.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun club lié à cette ligue pour cette saison. Les maillots de
              cette saison utiliseront la ligue actuelle du club par défaut.
            </p>
          )}

          {data && data.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Club</TableHead>
                    <TableHead>Saison</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {entry.club.logoUrl && (
                            <Image
                              src={entry.club.logoUrl}
                              alt=""
                              width={24}
                              height={24}
                              className="object-contain"
                            />
                          )}
                          <span className="font-medium">{entry.club.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {entry.club.shortName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{entry.season}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(entry)}
                          className="cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <AlertDialog
        open={applyConfirmOpen}
        onOpenChange={(open) => !applySeason.isPending && setApplyConfirmOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Appliquer la saison {season} comme courante ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tous les clubs ayant une entrée pour la saison {season} verront
              leur ligue actuelle (<code>Club.leagueId</code>) mise à jour pour
              correspondre à cette entrée. Les pages publiques affichant les
              clubs par ligue seront impactées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={applySeason.isPending}
              className="cursor-pointer"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApplySeason}
              disabled={applySeason.isPending}
              className="cursor-pointer"
            >
              {applySeason.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Application...
                </>
              ) : (
                "Appliquer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce club ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  Le club <b>{deleteTarget.club.name}</b> ne sera plus associé à
                  cette ligue pour la saison {deleteTarget.season}. Les maillots
                  de cette saison utiliseront la ligue actuelle du club par
                  fallback.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="cursor-pointer"
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AddClubForm({
  disabled,
  existingClubIds,
  country,
  onAdd,
}: {
  disabled: boolean;
  existingClubIds: Set<string>;
  country?: string;
  onAdd: (clubId: string) => Promise<void> | void;
}) {
  const [query, setQuery] = useState("");
  const { clubs: results, isLoading: searching } = useSearchClubs(query, country);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">Ajouter un club</label>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un club par nom..."
      />
      {searching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Recherche...
        </div>
      )}
      {results.length > 0 && (
        <div className="rounded-md border divide-y max-h-64 overflow-y-auto">
          {results.map((club) => {
            const already = existingClubIds.has(club.id);
            return (
              <div
                key={club.id}
                className="flex items-center justify-between gap-3 p-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {club.logoUrl && (
                    <Image
                      src={club.logoUrl}
                      alt=""
                      width={24}
                      height={24}
                      className="object-contain shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {club.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {club.league.name}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={disabled || already}
                  onClick={async () => {
                    await onAdd(club.id);
                    setQuery("");
                  }}
                  className="cursor-pointer shrink-0"
                >
                  {already ? (
                    "Déjà lié"
                  ) : (
                    <>
                      <Plus className="w-3 h-3 mr-1" />
                      Ajouter
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
