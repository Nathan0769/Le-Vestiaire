import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { locales } from "@/i18n/locales";

type Tree = { [key: string]: string | Tree };

function emailsOf(locale: string): Tree {
  const raw = readFileSync(join(process.cwd(), "messages", `${locale}.json`), "utf8");
  return (JSON.parse(raw) as { Emails?: Tree }).Emails ?? {};
}

function leafKeys(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" ? [`${prefix}${key}`] : leafKeys(value, `${prefix}${key}.`)
  );
}

describe("textes des relances (messages/*.json, Emails)", () => {
  const reference = leafKeys(emailsOf("fr")).sort();

  it("le français a les trois relances", () => {
    for (const step of ["d1", "d7", "d30"]) {
      expect(reference).toContain(`reminders.${step}.subject`);
      expect(reference).toContain(`reminders.${step}.cta`);
    }
  });

  it.each(locales.filter((l) => l !== "fr"))("%s a toutes les clés du français, non vides", (locale) => {
    const emails = emailsOf(locale);
    expect(leafKeys(emails).sort()).toEqual(reference);
    for (const key of reference) {
      const value = key.split(".").reduce<string | Tree>((node, k) => (node as Tree)[k], emails);
      expect(String(value).trim()).not.toBe("");
    }
  });
});
