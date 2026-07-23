import Image from "next/image";
import { Lock, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_ICONS, TIER_DISC } from "./achievement-visuals";

interface MedalTrophyProps {
  category: string;
  tier: string | null;
  unlocked: boolean;
  /** Progression 0..100, affiche un anneau autour des médailles verrouillées. */
  percentage?: number;
  /** Diamètre du disque en pixels. */
  size?: number;
  /** Badge illustré (R2). Si présent, remplace la médaille CSS. */
  imageUrl?: string | null;
  className?: string;
}

const LOCKED_DISC =
  "bg-muted text-muted-foreground border-2 border-dashed border-border";

export function MedalTrophy({
  category,
  tier,
  unlocked,
  percentage = 0,
  size = 80,
  imageUrl,
  className,
}: MedalTrophyProps) {
  const Icon = unlocked ? CATEGORY_ICONS[category] ?? Trophy : Lock;
  const discClass = unlocked && tier ? TIER_DISC[tier] : LOCKED_DISC;
  const iconSize = Math.round(size * (unlocked ? 0.4 : 0.32));

  const showRing = !unlocked && percentage > 0;
  const ringSize = size + 8;
  const r = (ringSize - 4) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(100, percentage) / 100);

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: ringSize, height: ringSize }}
    >
      {showRing && (
        <svg
          className="absolute inset-0 -rotate-90"
          width={ringSize}
          height={ringSize}
          aria-hidden="true"
        >
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={r}
            fill="none"
            className="stroke-muted"
            strokeWidth={3}
          />
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={r}
            fill="none"
            className="stroke-primary"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
      )}

      {imageUrl && unlocked ? (
        <Image
          src={imageUrl}
          alt=""
          width={size}
          height={size}
          unoptimized
          className="object-contain"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className={cn(
            "relative rounded-full grid place-items-center",
            discClass,
          )}
          style={{ width: size, height: size }}
        >
          {unlocked && (
            <span
              className="pointer-events-none absolute rounded-full border border-white/35"
              style={{ inset: size * 0.075 }}
              aria-hidden="true"
            />
          )}
          <Icon
            style={{ width: iconSize, height: iconSize }}
            strokeWidth={1.8}
            className={cn(unlocked && "drop-shadow-sm")}
          />
        </div>
      )}
    </div>
  );
}
