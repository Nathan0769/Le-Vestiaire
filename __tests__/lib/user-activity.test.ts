import { describe, it, expect, vi } from "vitest";
import { recordUserActivity, type UserActivityDeps } from "@/lib/user-activity";

const NOW = new Date("2026-10-28T23:30:00Z");

function makeDeps(setOnceResult: boolean | Error): UserActivityDeps & {
  setOnce: ReturnType<typeof vi.fn>;
  insertDay: ReturnType<typeof vi.fn>;
} {
  return {
    setOnce: vi.fn(async () => {
      if (setOnceResult instanceof Error) throw setOnceResult;
      return setOnceResult;
    }),
    insertDay: vi.fn(async () => {}),
  };
}

describe("recordUserActivity", () => {
  it("dédoublonne sur une clé Redis par utilisateur, jour UTC et plateforme", async () => {
    const deps = makeDeps(true);
    await recordUserActivity("u1", "ios", NOW, deps);
    expect(deps.setOnce).toHaveBeenCalledWith("user-activity:u1:2026-10-28:ios", 172800);
  });

  it("enregistre le jour et la plateforme à la première visite du jour", async () => {
    const deps = makeDeps(true);
    await recordUserActivity("u1", "web", NOW, deps);
    expect(deps.insertDay).toHaveBeenCalledWith("u1", "2026-10-28", "web");
  });

  it("n'écrit pas en base quand le jour est déjà enregistré", async () => {
    const deps = makeDeps(false);
    await recordUserActivity("u1", "web", NOW, deps);
    expect(deps.insertDay).not.toHaveBeenCalled();
  });

  it("absorbe une erreur Redis sans la propager", async () => {
    const deps = makeDeps(new Error("redis down"));
    await expect(recordUserActivity("u1", "web", NOW, deps)).resolves.toBeUndefined();
  });
});
