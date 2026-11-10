import { CFS_CLEARANCE_URL, withCfsSubId } from "@/lib/cfs-affiliate";

/**
 * Liens de la section "Bons plans" du menu. Une boutique partenaire qui obtient
 * cette visibilité (footballshirts.com, en discussion) s'ajoute ici.
 */
export const DEAL_LINKS = [{ id: "cfs", labelKey: "cfsSalesLink", url: withCfsSubId(CFS_CLEARANCE_URL, "menu") }] as const;
