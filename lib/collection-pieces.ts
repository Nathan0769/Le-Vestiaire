import type { CollectionPieces } from "@/types/community-stats";

export type CollectionPiecesRow = {
  signed: bigint;
  matchWorn: bigint;
  playerIssue: bigint;
  withCertificate: bigint;
  collectorsWithPiece: bigint;
};

/** Convertit la ligne agrégée ($queryRaw renvoie des bigint) en compteurs JSON-sérialisables. */
export function toCollectionPieces(
  row: CollectionPiecesRow | undefined
): CollectionPieces {
  return {
    signed: Number(row?.signed ?? 0),
    matchWorn: Number(row?.matchWorn ?? 0),
    playerIssue: Number(row?.playerIssue ?? 0),
    withCertificate: Number(row?.withCertificate ?? 0),
    collectorsWithPiece: Number(row?.collectorsWithPiece ?? 0),
  };
}
