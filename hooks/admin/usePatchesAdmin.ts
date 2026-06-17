import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PatchFamily } from "@/types/patch";

export interface AdminPatch {
  id: string;
  name: string;
  family: PatchFamily;
  leagueId: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  league: { id: string; name: string; country: string } | null;
  versions: {
    id: string;
    patchId: string;
    seasonStart: string;
    seasonEnd: string | null;
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
}

export function useAdminPatches() {
  return useQuery({
    queryKey: ["admin", "patches"],
    queryFn: async (): Promise<AdminPatch[]> => {
      const res = await fetch("/api/admin/patches");
      if (!res.ok) throw new Error("Erreur chargement patches");
      return res.json();
    },
  });
}

export function useCreatePatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      family: PatchFamily;
      leagueId?: string | null;
      isActive?: boolean;
      notes?: string | null;
    }) => {
      const res = await fetch("/api/admin/patches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur création");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "patches"] });
    },
  });
}

export function useUpdatePatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        family: PatchFamily;
        leagueId: string | null;
        isActive: boolean;
        notes: string | null;
      }>;
    }) => {
      const res = await fetch(`/api/admin/patches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur mise à jour");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "patches"] });
    },
  });
}

export function useDeletePatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/patches/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur suppression");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "patches"] });
    },
  });
}

export function useCreatePatchVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      patchId,
      seasonStart,
      seasonEnd,
      file,
    }: {
      patchId: string;
      seasonStart: string;
      seasonEnd?: string | null;
      file?: File | null;
    }) => {
      const fd = new FormData();
      fd.append("seasonStart", seasonStart);
      if (seasonEnd) fd.append("seasonEnd", seasonEnd);
      if (file) fd.append("file", file);

      const res = await fetch(`/api/admin/patches/${patchId}/versions`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur création version");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "patches"] });
    },
  });
}

export function useDeletePatchVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      patchId,
      versionId,
    }: {
      patchId: string;
      versionId: string;
    }) => {
      const res = await fetch(
        `/api/admin/patches/${patchId}/versions/${versionId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur suppression");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "patches"] });
    },
  });
}
