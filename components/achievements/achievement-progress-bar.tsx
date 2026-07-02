import { cn } from "@/lib/utils";

interface Props {
  value: number;
  max: number;
  className?: string;
}

export function AchievementProgressBar({ value, max, className }: Props) {
  const percentage = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={cn("h-2 w-full rounded-full bg-muted overflow-hidden", className)}>
      <div
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
