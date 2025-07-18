"use client";

import { useEffect } from "react";

export function ApplyThemeColor() {
  useEffect(() => {
    const color = localStorage.getItem("theme-color") || "blue";

    document.documentElement.classList.forEach((className) => {
      if (className.startsWith("theme-")) {
        document.documentElement.classList.remove(className);
      }
    });

    document.documentElement.classList.add(`theme-${color}`);
  }, []);

  return null;
}
