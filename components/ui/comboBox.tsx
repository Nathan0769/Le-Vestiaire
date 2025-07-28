"use client";

import * as React from "react";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  id: string;
  name: string;
};

type AutocompleteSelectProps = {
  options: SelectOption[];
  value: SelectOption | null;
  onChange: (value: SelectOption) => void;
  placeholder?: string;
  label?: string; // ✅ Ajout du label
  className?: string;
};

export function AutocompleteSelect({
  options,
  value,
  onChange,
  placeholder = "Sélectionner une option",
  label, // ✅ Nouveau prop label
  className,
}: AutocompleteSelectProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm font-medium ">{label}</label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn("w-full justify-between", className)}
          >
            {value ? value.name : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 ">
          <Command>
            <CommandInput placeholder="Rechercher..." />
            <CommandEmpty>Aucune option trouvée</CommandEmpty>
            <CommandList>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.id === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.name}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
