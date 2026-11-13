import { z } from "zod";
import { parseCfsSubId } from "@/lib/cfs-affiliate";

/**
 * Postback Tapfiliate : une requête par conversion (création ou changement de
 * statut), paramètres nommés comme dans Tapfiliate. Spec :
 * docs/specs/2026-11-09-ventes-affiliees-cfs.md.
 */

// Sans valeur, Tapfiliate envoie "null" (vu au test du 2026-11-13) ou laisse la variable ("${click_subid}").
const text = z
  .string()
  .trim()
  .max(255)
  .optional()
  .transform((v) => (v && v !== "null" && !v.startsWith("${") ? v : null));

const schema = z.object({
  conversion_id: z.string().trim().min(1).max(255),
  program_id: text,
  conversion_amount: text,
  commission_amount: text,
  currency: text,
  conversion_status: text,
  conversion_time: text,
  click_subid: text,
  click_time: text,
});

const toAmount = (v: string | null) => {
  const n = v === null ? NaN : Number(v);
  return Number.isFinite(n) ? n : null;
};

const toDate = (v: string | null) => {
  const d = v === null ? null : new Date(v);
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

export interface AffiliateConversionRow {
  network: "tapfiliate";
  conversionId: string;
  programId: string | null;
  amount: number | null;
  commission: number | null;
  currency: string | null;
  status: string | null;
  subId: string | null;
  placement: string | null;
  targetId: string | null;
  clickedAt: Date | null;
  convertedAt: Date | null;
}

/** Ligne `affiliate_conversions` d'un postback ; null sans identifiant de conversion. */
export function parseTapfiliatePostback(params: URLSearchParams): AffiliateConversionRow | null {
  const parsed = schema.safeParse(Object.fromEntries(params));
  if (!parsed.success) return null;
  const p = parsed.data;
  const { placement, targetId } = parseCfsSubId(p.click_subid);
  return {
    network: "tapfiliate",
    conversionId: p.conversion_id,
    programId: p.program_id,
    amount: toAmount(p.conversion_amount),
    commission: toAmount(p.commission_amount),
    currency: p.currency,
    status: p.conversion_status,
    subId: p.click_subid,
    placement,
    targetId,
    clickedAt: toDate(p.click_time),
    convertedAt: toDate(p.conversion_time),
  };
}
