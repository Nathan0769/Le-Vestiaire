import { NextResponse } from "next/server";
import axios from "axios";
import { requireRole } from "@/lib/check-permission";
import prisma from "@/lib/prisma";

export const maxDuration = 60;

const CFS_API_KEY = "key_8uhN6ajd7mHKd4K3";
const CFS_BROWSE_URL = "https://ac.cnstrc.com/browse/group_id";
const DISCOVERY_GROUP = "football-shirts";
const MAX_PAGES = 25;

const MAX_PRODUCTS_PER_CLUB = 1000;

const GENERIC_GROUP_IDS = new Set([
  // marketplaces / operations
  "clearance",
  "cfs-weekly-deals",
  "price-drops",
  "kids",
  "new-products",
  "new-products1",
  "all-football-shirts",
  "football-shirts",
  "warehouse-clearance",
  "new-clearance",
  "limited-warehouse-clearance",
  "best-sellers",
  "trending",
  "winter-sale",
  "hold",
  "social-spotlight",
  "shirts",
  // categories/collections
  "best-of-classic",
  "current-stars",
  "legends",
  "retro",
  "vintage",
  "reissue",
  "jersey-details",
  "kits",
  "authentic",
  "player-issue",
  "training",
  "long-sleeve",
  "goalkeeper",
  "signed-shirts",
  "match-worn",
  "match-issue",
  "personalised",
  "collectibles",
  "gifts",
  // events
  "euro-2024",
  "euro-2024-classics",
  "world-cup",
  "world-cup-2022",
  "world-cup-2026",
  "champions-league",
  "europa-league",
  // leagues (not clubs)
  "premier-league",
  "la-liga",
  "serie-a",
  "bundesliga",
  "ligue-1",
  "eredivisie",
  "primeira-liga",
  "championship",
  "womens",
  "international",
  "national-teams",
  "mls",
  "brasileirao",
  "j-league",
  "saudi-pro-league",
  "eu-classics",
  "european-classics",
  // brands
  "puma",
  "umbro",
  "nike",
  "adidas",
  "castore",
  "hummel",
  "macron",
  "new-balance",
  "kappa",
  "mizuno",
  "joma",
  "kelme",
  "le-coq-sportif",
  "lotto",
  "meyba",
  "diadora",
  "fila",
  "mitre",
  "copa",
  "concave",
  "erreà",
  "errea",
  "atletica",
  "luanvi",
  "marathon",
  "asics",
  "under-armour",
  "reebok",
  "kombat",
  "boxer",
  "jako",
]);

interface CnstrcResult {
  data: { group_ids?: string[] };
}

async function fetchPage(page: number): Promise<CnstrcResult[]> {
  const url = `${CFS_BROWSE_URL}/${DISCOVERY_GROUP}?key=${CFS_API_KEY}&num_results_per_page=100&page=${page}`;
  const res = await axios.get(url, { timeout: 15000 });
  return res.data.response?.results ?? [];
}

export async function GET() {
  const { error } = await requireRole(["superadmin"]);
  if (error) return error;

  try {
    const counts = new Map<string, number>();
    const BATCH_SIZE = 10;

    for (let start = 1; start <= MAX_PAGES; start += BATCH_SIZE) {
      const pages = Array.from(
        { length: Math.min(BATCH_SIZE, MAX_PAGES - start + 1) },
        (_, i) => start + i
      );
      const batches = await Promise.all(pages.map((p) => fetchPage(p)));
      let hasResults = false;
      for (const results of batches) {
        if (results.length > 0) hasResults = true;
        for (const item of results) {
          const ids = item.data.group_ids ?? [];
          for (const id of ids) {
            if (GENERIC_GROUP_IDS.has(id)) continue;
            counts.set(id, (counts.get(id) ?? 0) + 1);
          }
        }
      }
      if (!hasResults) break;
    }

    const existingAliases = await prisma.cfsClubAlias.findMany({
      select: { cfsName: true },
    });
    const mappedSlugs = new Set(
      existingAliases.map((a) =>
        a.cfsName.toLowerCase().replace(/\s+/g, "-")
      )
    );

    const discovered = Array.from(counts.entries())
      .filter(([slug, count]) => !mappedSlugs.has(slug) && count <= MAX_PRODUCTS_PER_CLUB)
      .map(([slug, count]) => ({
        slug,
        displayName: slug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        productCount: count,
      }))
      .sort((a, b) => b.productCount - a.productCount);

    return NextResponse.json({ clubs: discovered });
  } catch (err) {
    console.error("GET /api/admin/cfs-availability/discover error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la découverte" },
      { status: 500 }
    );
  }
}
