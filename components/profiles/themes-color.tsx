"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

const themeOptions = [
  "bleu",
  "bleu-nuit",
  "rouge",
  "violet",
  "vert",
  "orange",
  "jaune",
  "rose",
  "violet-leger",
  "marine",
  "gold",
];

export function ThemeColorSelect() {
  const t = useTranslations("Profile.themeColor");
  const [theme, setTheme] = useState("blue");

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
      <label className="text-sm font-medium">{t("label")}</label>
      <Select value={theme} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("placeholder")} />
        </SelectTrigger>
        <SelectContent>
          {themeOptions.map((color) => (
            <SelectItem key={color} value={color}>
              {t(`colors.${color}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
