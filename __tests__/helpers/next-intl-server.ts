import { readFileSync } from "fs";
import path from "path";

/**
 * `getTranslations` de next-intl/server ne tourne pas hors de Next (vitest).
 * Ce remplaçant lit les vrais `messages/<langue>.json` (t, t.raw, t.has), sans paramètres ICU.
 * Usage : vi.mock("next-intl/server", () => nextIntlServerMock());
 */
export function nextIntlServerMock() {
  return {
    getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) => {
      const messages = JSON.parse(readFileSync(path.join(process.cwd(), "messages", `${locale}.json`), "utf8"));
      const root = namespace.split(".").reduce((node, k) => node?.[k], messages);
      const lookup = (key: string) => key.split(".").reduce((node, k) => node?.[k], root);
      const t = (key: string) => {
        const value = lookup(key);
        if (typeof value !== "string") throw new Error(`traduction absente : ${locale} ${namespace}.${key}`);
        return value;
      };
      t.raw = lookup;
      t.has = (key: string) => lookup(key) !== undefined;
      return t;
    },
  };
}
