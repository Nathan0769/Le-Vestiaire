import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomPatchGroup } from "@/types/patch";

const CUSTOM_PATCHES_KEY = ["admin", "custom-patches"];

async function postJson<T>(url: string, body: unknown, fallback: string): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || fallback);
  }
  return res.json();
}

export function useCustomPatches() {
  return useQuery({
    queryKey: CUSTOM_PATCHES_KEY,
    queryFn: async (): Promise<CustomPatchGroup[]> => {
      const res = await fetch("/api/admin/custom-patches");
      if (!res.ok) throw new Error("Erreur chargement patchs perso");
      return res.json();
    },
  });
}

export function useLinkCustomPatches() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { ids: string[]; patchId: string; extendEligibility: boolean }) =>
      postJson<{ updated: number; deleted: number }>(
        "/api/admin/custom-patches/link",
        data,
        "Erreur rattachement"
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CUSTOM_PATCHES_KEY });
      // L'extension d'éligibilité modifie le patch et ses versions.
      qc.invalidateQueries({ queryKey: ["admin", "patches"] });
    },
  });
}

export function useRenameCustomPatches() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { ids: string[]; label: string }) =>
      postJson<{ count: number }>(
        "/api/admin/custom-patches/rename",
        data,
        "Erreur renommage"
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CUSTOM_PATCHES_KEY });
    },
  });
}

export function useDeleteCustomPatches() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { ids: string[] }) =>
      postJson<{ count: number }>(
        "/api/admin/custom-patches/delete",
        data,
        "Erreur suppression"
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CUSTOM_PATCHES_KEY });
    },
  });
}
