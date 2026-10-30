"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

interface CurrencySelectProps {
  id?: string;
  value: string;
  onChange: (currency: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function CurrencySelect({ id, value, onChange, className, ariaLabel }: CurrencySelectProps) {
  const locale = useLocale();
  // Noms de devises traduits par le navigateur : pas de clé de traduction à maintenir.
  const options = useMemo(() => {
    const names = new Intl.DisplayNames(locale, { type: "currency" });
    return SUPPORTED_CURRENCIES.map((code) => ({ code, name: names.of(code) ?? code }));
  }, [locale]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-label={ariaLabel} className={`cursor-pointer ${className ?? ""}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.code} value={o.code} className="cursor-pointer">
            <span className="font-medium">{o.code}</span>
            <span className="ml-2 text-muted-foreground">{o.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
