import { Badge as SealIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SupporterBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Masque le libellé et ne garde que le sceau certifié (listes denses). */
  iconOnly?: boolean;
}

const textSize = {
  sm: "text-[10px]",
  md: "text-[11px]",
  lg: "text-[13px]",
} as const;

const sealSize = {
  sm: "h-3.5 w-3.5",
  md: "h-[17px] w-[17px]",
  lg: "h-5 w-5",
} as const;

const checkSize = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
} as const;

/**
 * Emblème Supporter — sceau certifié doré (style compte vérifié, en or).
 * Marqueur de statut porté partout. Purement cosmétique, aucun gating.
 */
export function SupporterBadge({
  className,
  size = "md",
  iconOnly = false,
}: SupporterBadgeProps) {
  return (
    <span className={cn("cos-badge", textSize[size], className)}>
      {!iconOnly && <span>Supporter</span>}
      <span
        className={cn(
          "relative inline-grid flex-none place-items-center drop-shadow-[0_1px_2px_rgba(212,175,55,0.5)]",
          sealSize[size]
        )}
      >
        <SealIcon
          className="absolute inset-0 h-full w-full text-[#d4af37]"
          fill="currentColor"
          strokeWidth={0}
          aria-hidden
        />
        <Check
          className={cn("relative text-white", checkSize[size])}
          strokeWidth={4}
          aria-hidden
        />
      </span>
    </span>
  );
}
