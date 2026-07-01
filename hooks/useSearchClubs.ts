import { useState, useEffect } from "react";
import { useDebounce } from "./useDebounce";

export type ClubSearchResult = {
  id: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  league: {
    id: string;
    name: string;
  };
};

export function useSearchClubs(query: string, country?: string) {
  const [clubs, setClubs] = useState<ClubSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setClubs([]);
      return;
    }

    const controller = new AbortController();

    const searchClubs = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ q: debouncedQuery });
        if (country) params.set("country", country);
        const res = await fetch(`/api/clubs/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setClubs(data);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error searching clubs:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    searchClubs();

    return () => controller.abort();
  }, [debouncedQuery, country]);

  return { clubs, isLoading };
}
