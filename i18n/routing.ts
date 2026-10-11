import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";
import { locales, defaultLocale } from "./locales";

export const routing = defineRouting({
  locales,

  defaultLocale,
});

export type { Locale } from "./locales";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
