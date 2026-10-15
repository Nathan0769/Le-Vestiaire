import { describe, it, expect } from "vitest";
import { toCollectionPieces } from "@/lib/collection-pieces";

describe("toCollectionPieces", () => {
  it("convertit les compteurs bigint de la requête en nombres", () => {
    const pieces = toCollectionPieces({
      signed: BigInt(12),
      matchWorn: BigInt(3),
      playerIssue: BigInt(5),
      withCertificate: BigInt(7),
      collectorsWithPiece: BigInt(9),
    });

    expect(pieces).toEqual({
      signed: 12,
      matchWorn: 3,
      playerIssue: 5,
      withCertificate: 7,
      collectorsWithPiece: 9,
    });
  });

  it("retourne des zéros quand la requête ne renvoie aucune ligne", () => {
    expect(toCollectionPieces(undefined)).toEqual({
      signed: 0,
      matchWorn: 0,
      playerIssue: 0,
      withCertificate: 0,
      collectorsWithPiece: 0,
    });
  });
});
