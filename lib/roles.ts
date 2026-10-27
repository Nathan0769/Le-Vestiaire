/**
 * Droits d'affichage derives du role. Ne sert qu'a montrer ou cacher des
 * boutons : chaque route d'ecriture reverifie le role cote serveur.
 */
export function adminFlags(role: string | null | undefined) {
  const isSuperAdmin = role === "superadmin";
  return { isAdmin: isSuperAdmin || role === "admin", isSuperAdmin };
}
