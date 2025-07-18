"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const themeOptions = [
  "blue",
  "rose",
  "violet",
  "green",
  "orange",
  "yellow",
  "pink",
  "purple",
  "teal",
];

export function ThemeColorSelect() {
  const [theme, setTheme] = useState("blue");

  // Nettoyer les anciennes classes theme-*
  const applyTheme = (newTheme: string) => {
    document.documentElement.classList.forEach((cls) => {
      if (cls.startsWith("theme-")) {
        document.documentElement.classList.remove(cls);
      }
    });
    document.documentElement.classList.add(`theme-${newTheme}`);
  };

  useEffect(() => {
    const stored = localStorage.getItem("theme-color");
    const initialTheme =
      stored && themeOptions.includes(stored) ? stored : "blue";
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const handleChange = (value: string) => {
    setTheme(value);
    localStorage.setItem("theme-color", value);
    applyTheme(value);
  };

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">Couleur du thème</label>
      <Select value={theme} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choisir une couleur" />
        </SelectTrigger>
        <SelectContent>
          {themeOptions.map((color) => (
            <SelectItem key={color} value={color}>
              <span className="capitalize">{color}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
