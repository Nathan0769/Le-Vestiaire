import type { JerseyType, CfsMatchStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { parseCfsSeason, parseCfsType } from "@/lib/cfs-name-parser";

export interface CfsMatchInput {
  name: string;
  club: string | null;
}

export interface CfsMatchResult {
  jerseyId: string | null;
  season: string | null;
  type: JerseyType | null;
  matchStatus: CfsMatchStatus;
}

export async function loadCfsAliasMap(): Promise<Map<string, string>> {
  const aliases = await prisma.cfsClubAlias.findMany({
    select: { cfsName: true, clubId: true },
  });
  return new Map(aliases.map((a) => [a.cfsName, a.clubId]));
}

export async function resolveCfsMatch(
  promo: CfsMatchInput,
  aliasMap: Map<string, string>
): Promise<CfsMatchResult> {
  const season = parseCfsSeason(promo.name);
  const type = parseCfsType(promo.name);

  if (!season || !type) {
    return { jerseyId: null, season, type, matchStatus: "PARSE_FAILED" };
  }

  if (!promo.club) {
    return { jerseyId: null, season, type, matchStatus: "NEEDS_ALIAS" };
  }

  const clubId = aliasMap.get(promo.club);
  if (!clubId) {
    return { jerseyId: null, season, type, matchStatus: "NEEDS_ALIAS" };
  }

  const jersey = await prisma.jersey.findFirst({
    where: { clubId, season, type },
    orderBy: { variant: "asc" },
    select: { id: true },
  });

  if (!jersey) {
    return { jerseyId: null, season, type, matchStatus: "NO_JERSEY" };
  }

  return { jerseyId: jersey.id, season, type, matchStatus: "MATCHED" };
}
