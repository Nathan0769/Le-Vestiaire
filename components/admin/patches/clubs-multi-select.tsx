"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface ClubOption {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  league: { id: string; name: string };
}

interface ClubsMultiSelectProps {
  value: string[];
  onChange: (clubIds: string[]) => void;
  leagueIds?: string[];
  placeholder?: string;
}

export function ClubsMultiSelect({
  value,
  onChange,
  leagueIds,
  placeholder = "Sélectionner des clubs",
}: ClubsMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const queryKey = ["admin", "clubs", leagueIds?.join(",") ?? "all"];

  const { data: clubs = [], isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<ClubOption[]> => {
      const url = leagueIds && leagueIds.length > 0
        ? `/api/admin/clubs?leagueIds=${encodeURIComponent(leagueIds.join(","))}`
        : "/api/admin/clubs";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur chargement clubs");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const clubsById = useMemo(() => {
    const map = new Map<string, ClubOption>();
    for (const c of clubs) map.set(c.id, c);
    return map;
  }, [clubs]);

  const toggle = (clubId: string) => {
    if (value.includes(clubId)) {
      onChange(value.filter((id) => id !== clubId));
    } else {
      onChange([...value, clubId]);
    }
  };

  const remove = (clubId: string) => {
    onChange(value.filter((id) => id !== clubId));
  };

  const selectedClubs = value
    .map((id) => clubsById.get(id))
    .filter((c): c is ClubOption => c !== undefined);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between cursor-pointer"
            disabled={isLoading}
          >
            <span className="text-muted-foreground">
              {value.length === 0
                ? placeholder
                : `${value.length} club${value.length > 1 ? "s" : ""} sélectionné${value.length > 1 ? "s" : ""}`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher un club..." />
            <CommandList>
              <CommandEmpty>Aucun club trouvé.</CommandEmpty>
              <CommandGroup>
                {clubs.map((club) => {
                  const isSelected = value.includes(club.id);
                  return (
                    <CommandItem
                      key={club.id}
                      value={`${club.name} ${club.shortName}`}
                      onSelect={() => toggle(club.id)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {club.logoUrl && (
                        <div className="relative w-5 h-5 mr-2 shrink-0">
                          <Image
                            src={club.logoUrl}
                            alt={club.name}
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      )}
                      <span className="flex-1">{club.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {club.league.name}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedClubs.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedClubs.map((club) => (
            <Badge key={club.id} variant="secondary" className="gap-1 pr-1">
              {club.logoUrl && (
                <div className="relative w-3 h-3 shrink-0">
                  <Image
                    src={club.logoUrl}
                    alt=""
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
              <span>{club.name}</span>
              <button
                type="button"
                onClick={() => remove(club.id)}
                className="ml-1 rounded hover:bg-muted cursor-pointer"
                aria-label={`Retirer ${club.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
