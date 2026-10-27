import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/fr/jerseys/l1/clubs/c1/jerseys/j1",
  // Sur une page mise en cache (rendu statique), Next interrompt le rendu des
  // qu'un composant lit useSearchParams hors Suspense : la fiche maillot passait en 500.
  useSearchParams: () => {
    throw new Error("Bail out to client-side rendering: useSearchParams()");
  },
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1" }, loading: false }) }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import { usePendingIntent } from "@/hooks/usePendingIntent";

describe("usePendingIntent", () => {
  beforeEach(() => {
    replace.mockClear();
    window.history.replaceState(null, "", "/fr/jerseys/l1/clubs/c1/jerseys/j1?intent=add_wishlist&ref=x");
  });

  it("reprend l'intention de l'URL sans useSearchParams, puis la retire de l'URL", () => {
    const onTrigger = vi.fn();

    renderHook(() => usePendingIntent({ intent: "add_wishlist", jerseyId: "j1", onTrigger }));

    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/fr/jerseys/l1/clubs/c1/jerseys/j1?ref=x", { scroll: false });
  });

  it("ignore une intention destinee a un autre bouton", () => {
    const onTrigger = vi.fn();

    renderHook(() => usePendingIntent({ intent: "add_collection", jerseyId: "j1", onTrigger }));

    expect(onTrigger).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
