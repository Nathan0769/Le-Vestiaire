"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Accent = "violet" | "amber" | undefined;

interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  accent?: Accent;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

const accentBorder: Record<NonNullable<Accent>, string> = {
  violet: "border-purple-500/40 bg-purple-500/[0.03]",
  amber: "border-amber-500/40 bg-amber-500/[0.03]",
};

const accentIcon: Record<NonNullable<Accent>, string> = {
  violet: "text-purple-600",
  amber: "text-amber-600",
};

export function InfoCard({
  icon: Icon,
  title,
  accent,
  action,
  className,
  children,
}: InfoCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 space-y-3 transition-colors",
        accent && accentBorder[accent],
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              "h-4 w-4 text-muted-foreground",
              accent && accentIcon[accent]
            )}
          />
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h4>
        </div>
        {action}
      </div>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}
