"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronsUpDown, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PARTNER_SHOPS } from "@/lib/partner-shops/shops";
import { cn } from "@/lib/utils";

const STATUSES = [
  { value: "NEEDS_ALIAS", label: "Club inconnu" },
  { value: "NO_JERSEY", label: "Maillot absent" },
  { value: "PARSE_FAILED", label: "Titre illisible" },
  { value: "MATCHED", label: "Reliés auto" },
  { value: "MANUAL", label: "Reliés main" },
  { value: "IGNORED", label: "Ignorés" },
] as const;
type Status = (typeof STATUSES)[number]["value"];

const JERSEY_TYPES = ["HOME", "AWAY", "THIRD", "FOURTH", "GOALKEEPER", "SPECIAL"] as const;

interface ClubOption {
  id: string;
  name: string;
  shortName: string;
  league: { id: string; name: string };
}

interface Product {
  id: string;
  title: string;
  url: string;
  imageUrl: string | null;
  price: number;
  available: boolean;
  matchStatus: Status;
  jersey: { id: string; season: string; type: string; club: { name: string } } | null;
  parsed: { club: string | null; season: string | null; type: string | null };
}

interface Alias {
  id: string;
  externalName: string;
  club: { id: string; name: string };
}

interface RowDraft {
  clubId?: string;
  season?: string;
  type?: string;
}

export function PartnerShopsManager() {
  const [shop, setShop] = useState(PARTNER_SHOPS[0].slug);
  const [status, setStatus] = useState<Status>("NEEDS_ALIAS");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [counts, setCounts] = useState<Partial<Record<Status, number>>>({});
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ shop, status, page: String(page) });
      const res = await fetch(`/api/admin/partner-shops/products?${params}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Impossible de charger les produits");
        return;
      }
      setProducts(data.products);
      setCounts(data.counts);
      setTotal(data.total);
      setPageSize(data.pageSize);
    } catch {
      toast.error("Erreur lors du chargement des produits");
    }
  }, [shop, status, page]);

  const fetchAliases = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/partner-shops/aliases?shop=${shop}`);
      const data = await res.json();
      if (res.ok) setAliases(data.aliases);
    } catch {
      toast.error("Erreur lors du chargement des alias");
    }
  }, [shop]);

  useEffect(() => {
    void fetch("/api/admin/clubs")
      .then((res) => (res.ok ? res.json() : []))
      .then(setClubs)
      .catch(() => toast.error("Erreur lors du chargement des clubs"));
  }, []);

  useEffect(() => {
    setLoading(true);
    void Promise.all([fetchProducts(), fetchAliases()]).finally(() => setLoading(false));
  }, [fetchProducts, fetchAliases]);

  const clubsById = useMemo(() => new Map(clubs.map((c) => [c.id, c])), [clubs]);

  function draftFor(p: Product): Required<RowDraft> {
    const d = drafts[p.id] ?? {};
    return {
      clubId: d.clubId ?? "",
      season: d.season ?? p.parsed.season ?? "",
      type: d.type ?? p.parsed.type ?? "HOME",
    };
  }

  function updateDraft(id: string, patch: RowDraft) {
    setDrafts((all) => ({ ...all, [id]: { ...all[id], ...patch } }));
  }

  async function run(id: string, request: () => Promise<Response>, success: string) {
    try {
      setBusyId(id);
      const res = await request();
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }
      toast.success(success);
      await Promise.all([fetchProducts(), fetchAliases()]);
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setBusyId(null);
    }
  }

  const patchProduct = (p: Product, body: object, success: string) =>
    run(
      p.id,
      () =>
        fetch(`/api/admin/partner-shops/products/${p.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      success
    );

  const createAlias = (p: Product, clubId: string) =>
    run(
      p.id,
      () =>
        fetch("/api/admin/partner-shops/aliases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shop, externalName: p.parsed.club, clubId }),
        }),
      `Alias créé : ${p.parsed.club}`
    );

  const deleteAlias = (alias: Alias) =>
    run(
      alias.id,
      () => fetch(`/api/admin/partner-shops/aliases/${alias.id}`, { method: "DELETE" }),
      "Alias supprimé"
    );

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {PARTNER_SHOPS.length > 1 && (
            <select
              value={shop}
              onChange={(e) => {
                setShop(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              {PARTNER_SHOPS.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          {STATUSES.map((s) => (
            <Button
              key={s.value}
              size="sm"
              variant={status === s.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                setStatus(s.value);
                setPage(1);
              }}
            >
              {s.label} ({counts[s.value] ?? 0})
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucun produit.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Lu dans le titre</TableHead>
                <TableHead>Maillot relié</TableHead>
                <TableHead>Club / saison / type</TableHead>
                <TableHead className="w-64"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const d = draftFor(p);
                const selectedClub = d.clubId ? clubsById.get(d.clubId) : null;
                const busy = busyId === p.id;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt="" className="h-12 w-12 rounded object-cover" />
                        )}
                        <div className="min-w-0">
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-medium hover:underline"
                          >
                            {p.title}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                          <span className="text-xs text-muted-foreground">
                            {p.price.toFixed(2)} € {p.available ? "" : "· épuisé"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[p.parsed.club, p.parsed.season, p.parsed.type].map((v) => v ?? "?").join(" · ")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.jersey ? `${p.jersey.club.name} ${p.jersey.season} ${p.jersey.type}` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Popover
                          open={openPopover === p.id}
                          onOpenChange={(o) => setOpenPopover(o ? p.id : null)}
                        >
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-56 justify-between">
                              <span className="truncate">
                                {selectedClub ? selectedClub.name : "Club..."}
                              </span>
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
                                        updateDraft(p.id, { clubId: c.id });
                                        setOpenPopover(null);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          d.clubId === c.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <span className="flex-1">{c.name}</span>
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        {c.league.name}
                                      </span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Input
                          value={d.season}
                          onChange={(e) => updateDraft(p.id, { season: e.target.value })}
                          placeholder="2024-25"
                          className="w-24"
                        />
                        <select
                          value={d.type}
                          onChange={(e) => updateDraft(p.id, { type: e.target.value })}
                          className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                        >
                          {JERSEY_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {p.matchStatus === "NEEDS_ALIAS" && p.parsed.club && (
                          <Button
                            size="sm"
                            className="cursor-pointer"
                            disabled={!d.clubId || busy}
                            onClick={() => createAlias(p, d.clubId)}
                          >
                            Alias
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="cursor-pointer"
                          disabled={!d.clubId || !d.season || busy}
                          onClick={() =>
                            patchProduct(p, { action: "link", clubId: d.clubId, season: d.season, type: d.type }, "Produit relié")
                          }
                        >
                          Relier
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="cursor-pointer"
                          disabled={busy}
                          onClick={() => patchProduct(p, { action: "ignore" }, "Produit ignoré")}
                        >
                          Ignorer
                        </Button>
                        {(p.matchStatus === "MANUAL" || p.matchStatus === "IGNORED") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="cursor-pointer"
                            disabled={busy}
                            onClick={() => patchProduct(p, { action: "reset" }, "Matching recalculé")}
                          >
                            Réinitialiser
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {pageCount > 1 && (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer"
              disabled={page <= 1}
              onClick={() => setPage((n) => n - 1)}
            >
              Précédent
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {pageCount}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer"
              disabled={page >= pageCount}
              onClick={() => setPage((n) => n + 1)}
            >
              Suivant
            </Button>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-xl font-semibold">Alias ({aliases.length})</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Noms de club de la boutique qui diffèrent du catalogue. Les autres sont reconnus par leur nom.
        </p>
        {aliases.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucun alias.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom boutique</TableHead>
                <TableHead>Club interne</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aliases.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.externalName}</TableCell>
                  <TableCell>{a.club.name}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="cursor-pointer"
                      disabled={busyId === a.id}
                      onClick={() => deleteAlias(a)}
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
    </div>
  );
}
