import { cn } from "@/lib/utils";
import { SupporterBadge } from "./supporter-badge";

interface SupporterNameProps {
  name: React.ReactNode;
  isSupporter?: boolean | null;
  /** Classes appliquées au texte du nom. */
  className?: string;
  badgeSize?: "sm" | "md" | "lg";
  /** Masque l'emblème (garde seulement le nom doré). */
  hideBadge?: boolean;
}

/**
 * Rend le nom d'un utilisateur, doré + emblème s'il est supporter, brut sinon.
 * À placer là où le nom apparaît (listes, en-têtes, feed...).
 */
export function SupporterName({
  name,
  isSupporter,
  className,
  badgeSize = "sm",
  hideBadge = false,
}: SupporterNameProps) {
  if (!isSupporter) {
    return <span className={cn("truncate", className)}>{name}</span>;
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className={cn("truncate cos-name-gold", className)}>{name}</span>
      {!hideBadge && (
        <SupporterBadge size={badgeSize} iconOnly className="flex-shrink-0" />
      )}
    </span>
  );
}
