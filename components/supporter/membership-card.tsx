import { cn } from "@/lib/utils";

interface MembershipCardProps {
  name: string;
  userId: string;
  jerseyCount?: number;
  since: number;
  className?: string;
}

/** Numéro de membre stable, dérivé de l'id (flavor, pas d'identité réelle). */
function memberNumber(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return String(h % 10000).padStart(4, "0");
}

/**
 * Carte de membre du Cercle Supporter — pièce cosmétique maîtresse.
 * Automatique pour tout supporter actif ; matériaux définis dans globals.css.
 */
export function MembershipCard({
  name,
  userId,
  jerseyCount,
  since,
  className,
}: MembershipCardProps) {
  return (
    <div className={cn("w-full max-w-[420px]", className)}>
      <div className="cos-card flex flex-col justify-between p-6">
        <div className="relative z-[2] flex items-start justify-between">
          <span className="cos-gold-text font-serif text-[19px] font-semibold tracking-tight">
            Le Vestiaire
          </span>
          <div className="text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.24em] text-[#F4E6B0]">
            Membre
            <br />
            Supporter
          </div>
        </div>

        <div className="relative z-[2]">
          <p className="cos-gold-text font-serif text-[28px] italic leading-none">
            Cercle Supporter
          </p>
        </div>

        <div className="relative z-[2] flex items-end justify-between">
          <div>
            <div className="font-serif text-lg tracking-wide">{name}</div>
            <div className="mt-1 font-mono text-[11px] tracking-[0.16em] text-[#F3EEDF]/60">
              N° {memberNumber(userId)}
              {jerseyCount != null && ` · ${jerseyCount} maillots`}
            </div>
          </div>
          <div className="text-right font-mono text-[10px] uppercase tracking-[0.14em] text-[#F3EEDF]/55">
            Membre depuis
            <span className="mt-0.5 block text-[15px] tracking-[0.06em] text-[#F4E6B0]">
              {since}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
