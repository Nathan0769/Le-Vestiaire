"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Loader2, RefreshCw, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ClubOption {
  id: string;
  name: string;
  shortName: string;
  league: { id: string; name: string };
}

interface Alias {
  id: string;
  cfsName: string;
  clubId: string;
  club: { id: string; name: string; shortName: string };
}

interface DiscoveredClub {
  slug: string;
  displayName: string;
  productCount: number;
}

export function CfsAliasesManager() {
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [discovered, setDiscovered] = useState<DiscoveredClub[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [discoverySelections, setDiscoverySelections] = useState<
    Record<string, string>
  >({});
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [savingFor, setSavingFor] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    void Promise.all([fetchAliases(), fetchClubs()]).finally(() =>
      setLoading(false)
    );
  }, []);

  async function fetchAliases() {
    try {
      const res = await fetch("/api/admin/cfs-aliases");
      const data = await res.json();
      if (res.ok) setAliases(data.aliases);
      else toast.error(data.error || "Impossible de charger les alias");
    } catch {
      toast.error("Erreur lors du chargement des alias");
    }
  }

  async function fetchClubs() {
    try {
      const res = await fetch("/api/admin/clubs");
      const data = await res.json();
      if (res.ok) setClubs(data);
    } catch {
      toast.error("Erreur lors du chargement des clubs");
    }
  }

  async function handleDiscover() {
    try {
      setDiscovering(true);
      const res = await fetch("/api/admin/cfs-availability/discover");
      const data = await res.json();
      if (res.ok) {
        setDiscovered(data.clubs);
        toast.success(`${data.clubs.length} clubs CFS non mappés trouvés`);
      } else {
        toast.error(data.error || "Erreur lors de la découverte");
      }
    } catch {
      toast.error("Erreur lors de la découverte");
    } finally {
      setDiscovering(false);
    }
  }

  async function handleCreateFromDiscovery(cfsName: string) {
    const clubId = discoverySelections[cfsName];
    if (!clubId) return;
    try {
      setSavingFor(cfsName);
      const res = await fetch("/api/admin/cfs-aliases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cfsName, clubId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Alias créé : ${cfsName} → ${clubId}`);
        setDiscoverySelections((s) => {
          const copy = { ...s };
          delete copy[cfsName];
          return copy;
        });
        setDiscovered((list) => list.filter((d) => d.displayName !== cfsName));
        await fetchAliases();
      } else {
        toast.error(data.error || "Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setSavingFor(null);
    }
  }

  async function handleScrape() {
    try {
      setScraping(true);
      const res = await fetch("/api/admin/cfs-availability/scrape", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        const s = data.stats;
        toast.success(
          `Scrape terminé — ${s.clubsScanned} clubs, ${s.matched} maillots matchés, ${s.purged} obsolètes purgés`
        );
      } else {
        toast.error(data.error || "Erreur lors du scrape");
      }
    } catch {
      toast.error("Erreur lors du scrape");
    } finally {
      setScraping(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/cfs-aliases/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Alias supprimé");
        await fetchAliases();
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteId(null);
    }
  }

  const clubsById = useMemo(() => {
    const m = new Map<string, ClubOption>();
    for (const c of clubs) m.set(c.id, c);
    return m;
  }, [clubs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
        <div>
          <h2 className="text-lg font-semibold">Scrape dispo wishlist</h2>
          <p className="text-sm text-muted-foreground">
            Parcourt CFS par club (uniquement les clubs présents dans au moins une wishlist) et met à jour les dispos + promos. À lancer après avoir mappé un nouvel alias.
          </p>
        </div>
        <Button onClick={handleScrape} disabled={scraping} className="cursor-pointer shrink-0">
          {scraping ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Lancer le scrape
        </Button>
      </section>

      <section>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-semibold">
            Clubs CFS à mapper ({discovered.length})
          </h2>
          <Button
            onClick={handleDiscover}
            disabled={discovering}
            variant="outline"
            className="cursor-pointer"
          >
            {discovering ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Explorer CFS
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Clique sur &quot;Explorer CFS&quot; pour lister tous les clubs présents sur CFS mais pas encore mappés dans notre base. Ensuite, associe chaque nom CFS à un Club interne.
        </p>

        {discovered.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {discovering
              ? "Exploration en cours..."
              : "Clique sur \"Explorer CFS\" pour découvrir les clubs disponibles."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom CFS</TableHead>
                <TableHead className="w-20 text-center">Produits</TableHead>
                <TableHead>Club interne</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discovered.map((d) => {
                const selectedId = discoverySelections[d.displayName];
                const selectedClub = selectedId
                  ? clubsById.get(selectedId)
                  : null;
                return (
                  <TableRow key={d.slug}>
                    <TableCell className="font-medium">
                      {d.displayName}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {d.productCount}
                    </TableCell>
                    <TableCell>
                      <Popover
                        open={openPopover === d.displayName}
                        onOpenChange={(o) =>
                          setOpenPopover(o ? d.displayName : null)
                        }
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-72 justify-between"
                          >
                            {selectedClub
                              ? `${selectedClub.name} · ${selectedClub.league.name}`
                              : "Sélectionner un club..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0">
                          <Command>
                            <CommandInput placeholder="Rechercher un club..." />
                            <CommandList>
                              <CommandEmpty>Aucun club trouvé.</CommandEmpty>
                              <CommandGroup>
                                {clubs.map((c) => (
                                  <CommandItem
                                    key={c.id}
                                    value={`${c.name} ${c.shortName} ${c.league.name}`}
                                    onSelect={() => {
                                      setDiscoverySelections((s) => ({
                                        ...s,
                                        [d.displayName]: c.id,
                                      }));
                                      setOpenPopover(null);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedId === c.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <span className="flex-1">{c.name}</span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                      {c.league.name}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={!selectedId || savingFor === d.displayName}
                        onClick={() => handleCreateFromDiscovery(d.displayName)}
                      >
                        {savingFor === d.displayName ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Créer"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-1">
          Aliases existants ({aliases.length})
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Mappings actifs utilisés par le matcher.
        </p>

        {aliases.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucun alias.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom CFS</TableHead>
                <TableHead>Club interne</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aliases.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.cfsName}</TableCell>
                  <TableCell>{a.club.name}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteId(a.id)}
                      className="cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet alias ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les promos CFS liées à ce club perdront leur matching au prochain scrape.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
