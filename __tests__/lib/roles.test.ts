import { describe, it, expect } from "vitest";
import { adminFlags } from "@/lib/roles";

describe("adminFlags", () => {
  it("superadmin est aussi admin", () => {
    expect(adminFlags("superadmin")).toEqual({ isAdmin: true, isSuperAdmin: true });
  });

  it("admin n'est pas superadmin", () => {
    expect(adminFlags("admin")).toEqual({ isAdmin: true, isSuperAdmin: false });
  });

  it("utilisateur, role inconnu ou visiteur anonyme : aucun droit", () => {
    for (const role of ["user", "ADMIN", "", undefined, null]) {
      expect(adminFlags(role)).toEqual({ isAdmin: false, isSuperAdmin: false });
    }
  });
});
