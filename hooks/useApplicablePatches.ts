import { useQuery } from "@tanstack/react-query";
import type { ApplicablePatch } from "@/types/patch";

export function useApplicablePatches(jerseyId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["applicable-patches", jerseyId],
    queryFn: async (): Promise<ApplicablePatch[]> => {
      if (!jerseyId) return [];
      const res = await fetch(`/api/jerseys/${jerseyId}/applicable-patches`);
      if (!res.ok) {
        throw new Error("Erreur lors du chargement des patches");
      }
      return res.json();
    },
    enabled: enabled && !!jerseyId,
    staleTime: 5 * 60 * 1000,
  });
}
