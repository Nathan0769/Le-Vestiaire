import { describe, it, expect } from "vitest";
import { snapshotsToWrite } from "./snapshots";

const v = (jerseyId: string, baseValue: number, methodVersion = 2) => ({ jerseyId, baseValue, methodVersion });
const last = (value: number, methodVersion = 2) => ({ value, methodVersion });

describe("snapshotsToWrite", () => {
  it("n'écrit rien si la cote est identique au dernier snapshot", () => {
    expect(snapshotsToWrite([v("a", 42)], new Map([["a", last(42)]]))).toEqual([]);
  });

  it("écrit un snapshot si le maillot n'en a aucun", () => {
    expect(snapshotsToWrite([v("a", 42)], new Map())).toEqual([{ jerseyId: "a", value: 42, methodVersion: 2 }]);
  });

  // Vague 1 (2026-11-21) : la courbe ne suit plus le bruit d'un échantillon de 40 annonces.
  it("ignore une variation de moins de 2 %", () => {
    expect(snapshotsToWrite([v("a", 40.6)], new Map([["a", last(40)]]))).toEqual([]);
  });

  it("écrit au-delà de 2 %", () => {
    expect(snapshotsToWrite([v("a", 41.2)], new Map([["a", last(40)]]))).toEqual([
      { jerseyId: "a", value: 41.2, methodVersion: 2 },
    ]);
  });

  it("écrit toujours au changement de méthode", () => {
    expect(snapshotsToWrite([v("a", 40, 2)], new Map([["a", last(40, 1)]]))).toEqual([
      { jerseyId: "a", value: 40, methodVersion: 2 },
    ]);
  });
});
