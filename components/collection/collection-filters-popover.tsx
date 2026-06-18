"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Filter, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  EMPTY_FILTERS,
  countActiveFilters,
  type CollectionFilters,
  type TriStateFilter,
} from "@/lib/collection-filters";
import { cn } from "@/lib/utils";

const CONDITIONS = ["MINT", "EXCELLENT", "GOOD", "FAIR", "POOR"] as const;
const TYPES = ["HOME", "AWAY", "THIRD", "FOURTH", "GOALKEEPER", "SPECIAL"] as const;
const TRI_STATES: TriStateFilter[] = ["all", "yes", "no"];

export type AvailableLeague = { name: string; tier: number };

interface CollectionFiltersPopoverProps {
  filters: CollectionFilters;
  onChange: (next: CollectionFilters) => void;
  availableLeagues: AvailableLeague[];
}

function toggleArrayValue<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function CollectionFiltersPopover({
  filters,
  onChange,
  availableLeagues,
}: CollectionFiltersPopoverProps) {
  const t = useTranslations("Collection.filters");
  const tCondition = useTranslations("Condition");
  const tJerseyType = useTranslations("JerseyType");

  const activeCount = countActiveFilters(filters);

  const reset = () => onChange(EMPTY_FILTERS);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 px-3 py-2 gap-2 font-normal bg-transparent border-input shadow-xs hover:bg-accent dark:bg-input/30 dark:hover:bg-input/50 w-full sm:w-auto justify-center"
        >
          <Filter className="size-4 opacity-50" />
          <span>{t("button")}</span>
          {activeCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs h-5 min-w-5 px-1.5 font-medium">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" collisionPadding={12} className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium text-sm">{t("title")}</h3>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="h-7 px-2 text-xs gap-1"
            >
              <X className="w-3 h-3" />
              {t("reset")}
            </Button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
          <CollapsibleSection
            title={t("sections.condition")}
            activeCount={filters.conditions.length}
          >
            {CONDITIONS.map((c) => (
              <CheckboxRow
                key={c}
                id={`filter-condition-${c}`}
                label={tCondition(c)}
                checked={filters.conditions.includes(c)}
                onCheckedChange={() =>
                  onChange({
                    ...filters,
                    conditions: toggleArrayValue(filters.conditions, c),
                  })
                }
              />
            ))}
          </CollapsibleSection>

          <CollapsibleSection
            title={t("sections.type")}
            activeCount={filters.types.length}
          >
            {TYPES.map((type) => (
              <CheckboxRow
                key={type}
                id={`filter-type-${type}`}
                label={tJerseyType(type)}
                checked={filters.types.includes(type)}
                onCheckedChange={() =>
                  onChange({
                    ...filters,
                    types: toggleArrayValue(filters.types, type),
                  })
                }
              />
            ))}
          </CollapsibleSection>

          {availableLeagues.length > 0 && (
            <CollapsibleSection
              title={t("sections.league")}
              activeCount={filters.leagues.length}
            >
              {availableLeagues.map((league) => (
                <CheckboxRow
                  key={league.name}
                  id={`filter-league-${league.name}`}
                  label={league.name}
                  checked={filters.leagues.includes(league.name)}
                  onCheckedChange={() =>
                    onChange({
                      ...filters,
                      leagues: toggleArrayValue(filters.leagues, league.name),
                    })
                  }
                />
              ))}
            </CollapsibleSection>
          )}

          <div className="pt-2 space-y-3 border-t">

          <TriStateRow
            label={t("sections.flocked")}
            value={filters.flocked}
            onChange={(v) => onChange({ ...filters, flocked: v })}
            t={t}
          />
          <TriStateRow
            label={t("sections.signed")}
            value={filters.signed}
            onChange={(v) => onChange({ ...filters, signed: v })}
            t={t}
          />
          <TriStateRow
            label={t("sections.withPatches")}
            value={filters.withPatches}
            onChange={(v) => onChange({ ...filters, withPatches: v })}
            t={t}
          />
          <TriStateRow
            label={t("sections.gift")}
            value={filters.gift}
            onChange={(v) => onChange({ ...filters, gift: v })}
            t={t}
          />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CollapsibleSection({
  title,
  activeCount,
  children,
}: {
  title: string;
  activeCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(activeCount > 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full group cursor-pointer">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground group-hover:text-foreground transition-colors">
            {title}
          </h4>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] h-4 min-w-4 px-1 font-medium">
              {activeCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1.5 pt-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CheckboxRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 cursor-pointer text-sm hover:text-foreground"
    >
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <span>{label}</span>
    </label>
  );
}

function TriStateRow({
  label,
  value,
  onChange,
  t,
}: {
  label: string;
  value: TriStateFilter;
  onChange: (v: TriStateFilter) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="inline-flex rounded-md border bg-background">
        {TRI_STATES.map((state) => (
          <button
            key={state}
            type="button"
            onClick={() => onChange(state)}
            className={cn(
              "px-2.5 h-7 text-xs transition-colors first:rounded-l-md last:rounded-r-md cursor-pointer",
              value === state
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            )}
          >
            {t(`triState.${state}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
