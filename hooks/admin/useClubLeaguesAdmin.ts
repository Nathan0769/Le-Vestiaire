import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface AdminClubLeague {
  id: string;
  clubId: string;
  season: string;
  leagueId: string;
  createdAt: string;
  updatedAt: string;
  club: {
    id: string;
    name: string;
    shortName: string;
    logoUrl: string;
  };
  league: {
    id: string;
    name: string;
  };
}

export function useAdminClubLeagues(leagueId?: string, season?: string) {
  return useQuery({
    queryKey: ["admin", "club-leagues", leagueId, season],
    queryFn: async (): Promise<AdminClubLeague[]> => {
      const params = new URLSearchParams();
      if (leagueId) params.set("leagueId", leagueId);
      if (season) params.set("season", season);
      const res = await fetch(`/api/admin/club-leagues?${params}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      return res.json();
    },
    enabled: Boolean(leagueId && season),
  });
}

export function useCreateClubLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      clubId: string;
      season: string;
      leagueId: string;
    }): Promise<AdminClubLeague> => {
      const res = await fetch("/api/admin/club-leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      return data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "club-leagues"] }),
  });
}

export function useDeleteClubLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/club-leagues/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erreur");
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "club-leagues"] }),
  });
}

export function useApplySeasonAsCurrent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      season: string
    ): Promise<{ updated: number; total: number }> => {
      const res = await fetch("/api/admin/club-leagues/apply-season", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ season }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      return data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "club-leagues"] }),
  });
}
