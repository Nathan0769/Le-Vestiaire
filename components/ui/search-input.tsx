"use client";

import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

type Props = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
};

export function SearchInput({
  value = "",
  onChange,
  placeholder = "Rechercher...",
  delay = 300,
}: Props) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(localValue);
    }, delay);
    return () => clearTimeout(timeout);
  }, [localValue, delay, onChange]);

  return (
    <Input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder={placeholder}
      className="mb-6"
    />
  );
}
