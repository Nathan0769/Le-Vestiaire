"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "collection-view-mode";
const STORAGE_EVENT = "collection-view-mode:change";

export type CollectionViewMode = "showcase" | "compact";

function getSnapshot(): CollectionViewMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "compact" ? "compact" : "showcase";
}

function getServerSnapshot(): CollectionViewMode {
  return "showcase";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(STORAGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
}

export function useCollectionViewMode(): [
  CollectionViewMode,
  (mode: CollectionViewMode) => void,
] {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setMode = useCallback((newMode: CollectionViewMode) => {
    localStorage.setItem(STORAGE_KEY, newMode);
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }, []);

  return [mode, setMode];
}
