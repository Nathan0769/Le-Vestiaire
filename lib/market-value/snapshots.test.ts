import { describe, it, expect } from "vitest";
import { snapshotsToWrite } from "./snapshots";

describe("snapshotsToWrite", () => {
  it("n'écrit rien si la cote est identique au dernier snapshot", () => {
    const out = snapshotsToWrite([{ jerseyId: "a", baseValue: 42 }], new Map([["a", 42]]));
    expect(out).toEqual([]);
  });

  it("écrit un snapshot si la cote a changé", () => {
    const out = snapshotsToWrite([{ jerseyId: "a", baseValue: 45 }], new Map([["a", 42]]));
    expect(out).toEqual([{ jerseyId: "a", value: 45 }]);
  });

  it("écrit un snapshot si le maillot n'en a aucun", () => {
    const out = snapshotsToWrite([{ jerseyId: "a", baseValue: 42 }], new Map());
    expect(out).toEqual([{ jerseyId: "a", value: 42 }]);
  });

  it("compare au centime", () => {
    const out = snapshotsToWrite([{ jerseyId: "a", baseValue: 19.999 }], new Map([["a", 20]]));
    expect(out).toEqual([]);
  });
});
