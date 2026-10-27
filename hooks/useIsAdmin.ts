"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { adminFlags } from "@/lib/roles";

/** Role de l'utilisateur courant, lu cote client pour garder les pages du catalogue en cache. */
export function useIsAdmin() {
  return adminFlags(useCurrentUser()?.role);
}
