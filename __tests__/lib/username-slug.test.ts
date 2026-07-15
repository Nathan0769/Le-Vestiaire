import { describe, it, expect } from "vitest";
import { slugifyForUsername } from "@/lib/username-slug";

describe("slugifyForUsername", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(slugifyForUsername("Jean Dupont")).toBe("jean-dupont");
  });

  it("strips accents and diacritics", () => {
    expect(slugifyForUsername("Éloïse Müller")).toBe("eloise-muller");
  });

  it("collapses consecutive non-alphanum to a single dash", () => {
    expect(slugifyForUsername("Bob   ###   Smith")).toBe("bob-smith");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugifyForUsername("-Nathan-")).toBe("nathan");
  });

  it("caps output at 20 characters", () => {
    expect(slugifyForUsername("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")).toHaveLength(20);
  });

  it("returns empty string for input with no alphanum", () => {
    expect(slugifyForUsername("###---###")).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(slugifyForUsername("")).toBe("");
    expect(slugifyForUsername("   ")).toBe("");
  });

  it("preserves digits", () => {
    expect(slugifyForUsername("User 42")).toBe("user-42");
  });
});
