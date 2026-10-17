import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";
import { SIZE_ERROR_MESSAGES } from "@/lib/jersey-size";
import { PURCHASE_DATE_ERROR_MESSAGES } from "@/lib/purchase-date";

/**
 * Parité des codes d'erreur web ↔ iOS. Liste tous les `code` que l'API peut
 * renvoyer et la compare à `contracts/fixtures/error-codes.json`. L'app iOS
 * vérifie que chacun de ces codes a une traduction dans `ServerMessage`
 * (target LeVestiaireTests).
 *
 * Code ajouté ou retiré : `UPDATE_CONTRACTS=1 pnpm exec vitest run
 * __tests__/contracts`, puis `scripts/sync-contracts.sh` côté iOS.
 */

const ROOT = path.resolve(__dirname, "../..");
const FIXTURE = path.join(ROOT, "contracts/fixtures/error-codes.json");
const UPDATE = process.env.UPDATE_CONTRACTS === "1";

// Codes passés par une variable (`code: jerseySizeErrorCode(size)`), donc
// invisibles pour la recherche des littéraux.
const CODES_FROM_TABLES = [
  ...Object.keys(SIZE_ERROR_MESSAGES),
  ...Object.keys(PURCHASE_DATE_ERROR_MESSAGES),
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

function apiErrorCodes(): string[] {
  const codes = new Set(CODES_FROM_TABLES);
  for (const file of [...sourceFiles(path.join(ROOT, "app")), ...sourceFiles(path.join(ROOT, "lib"))]) {
    for (const match of readFileSync(file, "utf8").matchAll(/code: "([A-Z][A-Z0-9_]+)"/g)) {
      codes.add(match[1]);
    }
  }
  return [...codes].sort();
}

describe("Codes d'erreur web ↔ iOS", () => {
  it("la liste des codes renvoyés par l'API correspond à la fixture", () => {
    const codes = apiErrorCodes();
    if (UPDATE) {
      writeFileSync(FIXTURE, JSON.stringify(codes, null, 2) + "\n");
      return;
    }
    expect(existsSync(FIXTURE), "fixture manquante : error-codes.json (UPDATE_CONTRACTS=1)").toBe(true);
    expect(codes).toEqual(JSON.parse(readFileSync(FIXTURE, "utf8")));
  });
});
